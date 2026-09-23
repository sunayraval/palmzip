const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  console.log(`Converting ${files.length} files in ${dir}...`);
  const start = Date.now();
  let totalOrig = 0;
  let totalWebp = 0;

  for (let i = 0; i < files.length; i += 8) {
    const chunk = files.slice(i, i + 8);
    await Promise.all(chunk.map(async f => {
      const src = path.join(dir, f);
      const dest = path.join(dir, f.replace(/\.png$/, '.webp'));
      const stat = fs.statSync(src);
      totalOrig += stat.size;
      await sharp(src).webp({ quality: 80, effort: 4 }).toFile(dest);
      const webpStat = fs.statSync(dest);
      totalWebp += webpStat.size;
    }));
    if ((i + 8) % 40 === 0 || i + 8 >= files.length) {
      console.log(`Processed ${Math.min(i + 8, files.length)} / ${files.length} frames...`);
    }
  }
  const elapsed = (Date.now() - start) / 1000;
  const origMB = (totalOrig / 1024 / 1024).toFixed(1);
  const webpMB = (totalWebp / 1024 / 1024).toFixed(1);
  const percent = (100 - (totalWebp / totalOrig) * 100).toFixed(1);
  console.log(`Finished ${dir} in ${elapsed.toFixed(1)}s: ${origMB}MB -> ${webpMB}MB (${percent}% reduction)`);
}

async function main() {
  const dirs = [
    'public/sequence',
    'public/story-assets/bayarea',
    'public/story-assets/vending-machine',
    'public/story-assets/md-to-calli'
  ];

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      await convertDir(dir);
    }
  }
  console.log('All conversions complete!');
}

main().catch(err => {
  console.error('Error during conversion:', err);
  process.exit(1);
});
