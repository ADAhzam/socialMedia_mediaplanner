'use strict';
module.exports = {
  ...require('./lib'),
  ...require('./render/generate'),      // generate, generateBuffer, withModules
  buildDeckModel: require('./render/viewmodel').buildDeckModel,
  prepareForRender: require('./render/gate').prepareForRender,
  buildTargeting: require('./render/modules/targeting').buildTargeting,
  buildKeywords: require('./render/modules/keywords').buildKeywords,
};
