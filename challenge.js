var Challenge = function (user, bet) 
{
  this._user = user;
  this._bet = bet;
};

Challenge.prototype.getUser = new function()
{
  return this._user;
};

Challenge.prototype.getBet = new function()
{
  return this._bet;
};

module.exports = Challenge;