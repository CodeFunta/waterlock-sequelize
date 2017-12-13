/**
 * Attempt
 *
 * @module      :: Model
 * @description :: Tracks login attempts of users on your app.
 * @docs        :: http://waterlock.ninja/documentation
 */

module.exports = {

  attributes: require('waterlock').models.attempt.attributes({
    
    /* e.g.
    nickname: 'string'
    */
    
  }),
  
  associations: require('waterlock').models.attempt.associations,
  options: require('waterlock').models.attempt.options,
};