const Joi = require('joi');

const simpleSchemas = {
  //account schemas
  accountUpdate: Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{6,30}$/).error(() => `Invalid password provided`),
    currentPassword: Joi.string().regex(/^[a-zA-Z0-9]{6,30}$/).error(() => `Invalid current password provided`),
    firstName: Joi.string().empty(""),
    lastName: Joi.string().empty(""),
    profileImageUrl: Joi.string().empty(""),
  }),

  //shift schemas
  shiftUpdate: Joi.object().keys({
    user: Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid user id provided`),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    warehouse: Joi.string().valid(['Irvine DLA9','Los Angelos LAX1']).required(),
    status: Joi.string().valid(['Worked','Scheduled']).required(),
  }),
}

const validSchemas = {
  //auth routes
  '/api/auth/signup': Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{6,30}$/).required().error(() => `Invalid password provided`),
    firstName: Joi.string().empty(""),
    lastName: Joi.string().empty(""),
    profileImageUrl: Joi.string().empty(""),
    remember: Joi.boolean().valid([true,false]),
  }),

  '/api/auth/signin': Joi.object().keys({
    email: Joi.string().email().required(),
    silentAuth: Joi.boolean().valid([true,false]),
    password: Joi.string().required(),
  }),

  //model routes
  '/api/models/query': Joi.object().keys({
    model: Joi.string().valid(['Shift']).required(),
    sortBy: Joi.string(),
    sortDirection: Joi.string().lowercase().valid(['asc', 'desc', 'ascending', 'descending', '1', '-1']).default('asc'),
    activePage: Joi.number().integer().default(1),
    rowsPerPage: Joi.number().integer().default(10),
    query: Joi.array().items(
      Joi.string().empty(""),
      Joi.boolean(),
      Joi.number(),
      Joi.array().items(Joi.string().empty(""),Joi.boolean(),Joi.array()),
    ).max(1000).default([]),
    populateArray: Joi.array().max(1000).default([]),
  }),

  '/api/models/get-all': Joi.object().keys({
    limit: Joi.number().integer().default(10).max(100),
    documentRef: Joi.object(),
    regex: Joi.boolean().default(false),
    populateArray: Joi.array().max(1000).default([]),
    model: Joi.string().valid(['Shift', 'UserToken']).required(),
  }),

  '/api/models/upsert': Joi.object().keys({
    model: Joi.string().valid(['Shift']).required(),
    filterRefs: Joi.array().max(50).items(Joi.string().required()).required(),
    refModel: Joi.string().valid(['Shift']),
    refUpdates: Joi.array().max(7000),
    data: Joi.array().max(7000).default([]).items(simpleSchemas.shiftUpdate).required(),
  }),

  '/api/models/delete': Joi.object().keys({
    model: Joi.string().valid(['Shift']).required(),
    data: Joi.array().max(7000).items(Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid id provided`)).required(),
  }),

  //account routes
  '/api/account/email-verification': Joi.object().keys({
    user: Joi.object().keys({
      id: Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid id provided`),
    }),
  }),

  '/api/account/reset-password': Joi.object().keys({
    token: Joi.object().keys({
      _id: Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid token provided`),
      user: Joi.object().keys({
        _id: Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid user _id provided in token`),
      }),
    }),
    update: simpleSchemas.accountUpdate,
    email: Joi.string().email(),
  }),

  '/api/account/update': Joi.object().keys({
    user: Joi.object().keys({
      id: Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid id provided`),
    }),
    update: simpleSchemas.accountUpdate,
  }),

  '/api/account': Joi.object().keys({
    user: Joi.object().keys({
      id: Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid id provided`),
    }),
  }),

  '/api/account/verify': Joi.object().keys({
    token_id: Joi.string().regex(/^[a-f\d]{24}$/i).required().error(() => `Invalid token provided`),
  }),
  
}

exports.validateSchema = function (config) {
  try {
    let { data, schema, options = {} } = config
    options = {
      stripUnknown: true,
      ...options
    }
    if (!validSchemas[schema]) {
      throw 'Invalid Schema'
    }
    return validSchemas[schema].validate(data,options)
    // switch(schema) {
    //   case 'user':
    //     return userSchema.validate(data,options);
    //   case 'updatePoProduct':
    //     return updatePoProductSchema.validate(data,{stripUnknown: true})
    //   case 'productUpdate':
    //     return productUpdateSchema.validate(data,{stripUnknown: true})
    //   case 'poUpdate':
    //     return poUpdateSchema.validate(data,{stripUnknown: true})
    //   case 'modelQuery':
    //     return modelQuerySchema.validate()
    //   default :
    //     throw 'Invalid Schema'
    // }
  } catch (message) {
    message = message || 'Invalid Schema'
    return {
      error: {
        details: [{message}],
      }
    };
  }
};

exports.validator = function (req, res, next) {
  try {
    let schema = req.originalUrl.endsWith("/") ? req.originalUrl.slice(0,req.originalUrl.length-1) : req.originalUrl
    console.log({schema, body: req.body})
    let options = {
      stripUnknown: true,
    }
    if (!validSchemas[schema]) {
      //maybe throw err or run default schema check
      throw 'Invalid Schema'
      //return next();
    }
    let result = validSchemas[schema].validate(req.body, options)
    if (result.error){
      return next({
        status: 400,
        message: result.error.details.map(d => d.message),
      })
    }
    req.body = result.value
    return next();
  } catch (message) {
    return next({
      status: 400,
      message: [message || 'Invalid Schema'],
    });
  }
};