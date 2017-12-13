/**
 * Use
 *
 * @module      :: Model
 * @description :: Tracks the usage of a given Jwt
 * @docs        :: http://waterlock.ninja/documentation
 */

module.exports = {

  attributes: require('waterlock').models.use.attributes({
    
    /* e.g.
    nickname: 'string'
    */
    
  }),
  associations: require('waterlock').models.use.associations,
  options: require('waterlock').models.use.options,
};
