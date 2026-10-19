'use strict';

const express = require('express');
const Validator = require('../../shared/middleware/validation');
const FootballController = require('./controller');
const { idParams, pageQuery, profileParams, ratingsQuery } = require('./dto/query.dto');

const router = express.Router();

router.get('/ratings', Validator.middleware({ query: ratingsQuery }), FootballController.ratings);
router.get('/profiles', Validator.middleware({ query: ratingsQuery }), FootballController.profiles);
router.get('/profiles/:type/:id', Validator.middleware({ params: profileParams }), FootballController.profile);
router.get('/leagues', Validator.middleware({ query: pageQuery }), FootballController.leagues);
router.get('/leagues/:id', Validator.middleware({ params: idParams }), FootballController.league);
router.get('/competitions', Validator.middleware({ query: pageQuery }), FootballController.competitions);
router.get('/competitions/:id', Validator.middleware({ params: idParams }), FootballController.competition);
router.get('/coaches', Validator.middleware({ query: pageQuery }), FootballController.coaches);
router.get('/coaches/:id', Validator.middleware({ params: idParams }), FootballController.coach);

module.exports = router;
