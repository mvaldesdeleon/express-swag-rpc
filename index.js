const local = require('local-rpc');

const defaultTransform = (...args) => args;
const defaultResponse = res => response => res.status(200).send(response);
const defaultError = res => () => res.sendStatus(500);

module.exports = function(transforms = {}, responses = {}, error) {
    return function(req, res, next) {
        const { swagger } = req;

        if (swagger) {
            const { path, operation, params } = swagger;

            const args = Object.keys(params).reduce((arr, key) => arr.concat(params[key]), []).map(x => x.value);

            const service = operation['x-service'] || path['x-service'];
            const method = operation['x-method'] || path['x-method'];
            const transform = operation['x-transform'] || path['x-transform'];
            const response = operation['x-response'] || path['x-response'];

            const transformFn = transforms[transform] || defaultTransform;
            const responseFn = responses[response] || defaultResponse;
            const errorFn = error || defaultError;

            try {
                local[service][method].call(null, transformFn(...args))
                    .then(responseFn(res))
                    .catch(errorFn(res));
            } catch(err) { errorFn(res)(err); }
        } else next();
    };
};
