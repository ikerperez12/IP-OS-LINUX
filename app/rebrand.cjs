const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.html') || filePath.endsWith('.json')) {
        results.push(filePath);
      }
    }
  });
  return results;
};

const replaceInFiles = () => {
  const dirs = [
    'C:/PROYECTOS/IDEAS/LINUX/app/src',
    'C:/PROYECTOS/IDEAS/LINUX/app/index.html',
    'C:/PROYECTOS/IDEAS/LINUX/app/package.json'
  ];
  
  let allFiles = [];
  dirs.forEach(d => {
    if (fs.existsSync(d)) {
      const stat = fs.statSync(d);
      if (stat.isDirectory()) {
        allFiles = allFiles.concat(walk(d));
      } else {
        allFiles.push(d);
      }
    }
  });

  allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
      .replace(/UbuntuOS/g, 'IP Linux')
      .replace(/ubuntuos/g, 'iplinux')
      .replace(/Ubuntu/g, 'IP Linux')
      .replace(/ubuntu/g, 'iplinux');
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  });
};

replaceInFiles();
