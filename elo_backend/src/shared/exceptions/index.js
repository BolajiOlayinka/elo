const BaseException = require('./base.exception');
const UnauthorizedException = require('./unauthorized.exception');
const NotFoundException = require('./not-found.exception');
const ConflictException = require('./conflict.exception');
const InternalServerException = require('./internal-server.exception');
const UnprocessableEntityException = require('./unprocessable-entity.exception');
const BadRequestException = require('./bad-request.exception');
const ForbiddenException = require('./forbidden.exception');
const ValidationException = require('./validation.exception');

module.exports = {
    BaseException,
    UnauthorizedException,
    NotFoundException,
    ConflictException,
    InternalServerException,
    UnprocessableEntityException,
    BadRequestException,
    ForbiddenException,
    ValidationException
};
