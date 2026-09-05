/* eslint-disable no-console */
/**
 * Cloudinary pre-flight. Does a real upload -> verify -> delete round trip,
 * so a pass here means product image uploads will genuinely work.
 */
import { env } from '../config/env.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';

// A 1x1 PNG, so the check costs practically nothing.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const MISSING_HINT = `
  Cloudinary is not configured. Add these to server/.env:

    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=

  Find them on your Cloudinary dashboard under
  "Product Environment Credentials".
`;

const DIAGNOSIS = [
  {
    match: (message) => /Invalid api_key|api_key/i.test(message),
    hint: 'CLOUDINARY_API_KEY looks wrong. It is a long number, not the cloud name.',
  },
  {
    match: (message) => /Invalid Signature|api_secret/i.test(message),
    hint: 'CLOUDINARY_API_SECRET is wrong. Reveal it on the dashboard and copy it exactly (no spaces).',
  },
  {
    match: (message) => /cloud_name|Unknown API/i.test(message),
    hint: 'CLOUDINARY_CLOUD_NAME is wrong. It is the short name on your dashboard, e.g. "dab12cdef".',
  },
  {
    match: (message) => /ENOTFOUND|ETIMEDOUT|ECONNREFUSED/i.test(message),
    hint: 'Could not reach Cloudinary. Check your internet connection.',
  },
];

const run = async () => {
  if (!env.cloudinary.enabled) {
    console.log(MISSING_HINT);
    process.exit(1);
  }

  console.log(`\nCloud name: ${env.cloudinary.cloudName}`);
  console.log(`Folder:     ${env.cloudinary.folder}/diagnostics\n`);

  let uploaded;
  try {
    console.log('  Uploading a test image...');
    uploaded = await uploadImage(PIXEL, { folder: 'diagnostics' });
    console.log(`  Upload OK    -> ${uploaded.url}`);
  } catch (error) {
    console.error(`\n  Upload FAILED: ${error.message}\n`);
    const diagnosis = DIAGNOSIS.find((entry) => entry.match(error.message));
    console.error(diagnosis ? `  Likely cause:\n  ${diagnosis.hint}\n` : '  Check your Cloudinary credentials in server/.env\n');
    process.exit(1);
  }

  console.log('  Cleaning up...');
  await deleteImage(uploaded.publicId);
  console.log('  Delete OK');

  console.log('\nCloudinary is working. You can now upload product images from the admin dashboard.\n');
  process.exit(0);
};

run();
