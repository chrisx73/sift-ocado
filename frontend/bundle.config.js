/**
 * Main scripts for the Sift to be bundled
 */
var mainJS = [
  {
    name: 'view',
    indexFile: './src/scripts/view.js'
  },
  {
    name: 'detail',
    indexFile: './src/scripts/detail.js'
  },
  {
    name: 'controller',
    indexFile: './src/scripts/controller.js'
  }
];

/**
 * Main styles for the Sift to be bundled
 */
var styles = [
  {
    name: 'style',
    indexFile: './src/styles/style.styl'
  }
];

/**
 * Default configurations
 */
var defaults = {
  formats: ['es', 'umd'],
  outputFolder: './public/dist',
  moduleNameJS: 'SiftOcado',
  mapsDest: '.',
  externalMappings: {},
  useNormalizeCSS: false
};

function bundles(type) {
  var l, v, r =[];
  switch(type) {
    case 'css':
      l = styles;
      v = 'styles';
      break;
    case 'js':
      l = mainJS;
      v = 'mainJS';
      break;
    default:
      console.error('Unsupported bundle type: ', type);
      return;
  }
  l.forEach(function (o) {
    var oo = {};
    oo[v] = o;
    r.push(Object.assign(oo, defaults));
  });
  return r;
}

module.exports = bundles;
