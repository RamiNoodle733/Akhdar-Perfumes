#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import Collection from '../src/models/Collection.js';

dotenv.config();

const [, , csvFilePathArg] = process.argv;

if (!csvFilePathArg) {
  console.error('Usage: node scripts/import-shopify-products.js <path/to/shopify-products.csv>');
  process.exit(1);
}

const csvFilePath = path.resolve(process.cwd(), csvFilePathArg);
if (!fs.existsSync(csvFilePath)) {
  console.error(`CSV file not found: ${csvFilePath}`);
  process.exit(1);
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return header.reduce((acc, key, index) => {
      acc[key] = values[index] ?? '';
      return acc;
    }, {});
  });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function findOrCreateCollectionsByTags(tagsString) {
  const tags = (tagsString || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const ids = [];

  for (const tag of tags) {
    const handle = slugify(tag);
    let collection = await Collection.findOne({ handle });

    if (!collection) {
      collection = await Collection.create({
        title: tag,
        handle,
        description: `Imported from Shopify tag: ${tag}`,
        published: true
      });
    }

    ids.push(collection._id);
  }

  return ids;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/akhdar-perfumes';
  await mongoose.connect(mongoUri);

  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  const rows = parseCsv(csvContent);

  const groupedByHandle = new Map();

  for (const row of rows) {
    const handle = row.Handle || slugify(row.Title);
    if (!handle) continue;

    const existing = groupedByHandle.get(handle) || [];
    existing.push(row);
    groupedByHandle.set(handle, existing);
  }

  let created = 0;
  let updated = 0;

  for (const [handle, entries] of groupedByHandle.entries()) {
    const base = entries[0];
    const title = base.Title || handle;

    const images = entries
      .map((entry, index) => entry['Image Src'] ? {
        url: entry['Image Src'],
        alt: entry['Image Alt Text'] || title,
        position: index
      } : null)
      .filter(Boolean);

    const variants = entries
      .filter((entry) => entry['Variant Title'] && entry['Variant Title'] !== 'Default Title')
      .map((entry) => ({
        name: entry['Variant Title'],
        price: toNumber(entry['Variant Price'], toNumber(base['Variant Price'], 0)),
        compareAtPrice: toNumber(entry['Variant Compare At Price']) || undefined,
        sku: entry['Variant SKU'] || undefined,
        inventory: toNumber(entry['Variant Inventory Qty'], 0)
      }));

    const collections = await findOrCreateCollectionsByTags(base.Tags);

    const productPayload = {
      title,
      handle,
      description: base['Body (HTML)'] || base['Body HTML'] || 'Imported from Shopify',
      shortDescription: (base['Body (HTML)'] || '').replace(/<[^>]*>/g, '').slice(0, 220),
      price: toNumber(base['Variant Price'], 0),
      compareAtPrice: toNumber(base['Variant Compare At Price']) || undefined,
      images,
      variants,
      tags: (base.Tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      collections,
      vendor: base.Vendor || 'Akhdar Perfumes',
      productType: base.Type || 'Perfume Oil',
      status: (base.Status || 'active').toLowerCase() === 'active' ? 'active' : 'draft',
      inventory: {
        quantity: toNumber(base['Variant Inventory Qty'], 0),
        trackInventory: true,
        allowBackorder: false
      },
      publishedAt: base.Published === 'TRUE' ? new Date() : undefined
    };

    const existingProduct = await Product.findOne({ handle });

    if (existingProduct) {
      await Product.updateOne({ _id: existingProduct._id }, productPayload);
      updated += 1;
    } else {
      await Product.create(productPayload);
      created += 1;
    }
  }

  console.log(`Shopify import complete. Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Shopify product import failed:', error);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error('Failed to disconnect MongoDB:', disconnectError);
  }
  process.exit(1);
});
