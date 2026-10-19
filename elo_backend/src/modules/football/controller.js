'use strict';

const FootballService = require('./service');

class FootballController {
    static async ratings(req, res) {
        const result = await FootballService.ratings(req.query);

        res.json({ error: false, ...result });
    }

    static async profiles(req, res) {
        const result = await FootballService.profiles(req.query);

        res.json({ error: false, ...result });
    }

    static async profile(req, res) {
        const result = await FootballService.profile(req.params.type, req.params.id);

        res.json({ error: false, data: result });
    }

    static async leagues(req, res) {
        const result = await FootballService.leagues(req.query);

        res.json({ error: false, ...result });
    }

    static async league(req, res) {
        const result = await FootballService.league(req.params.id);

        res.json({ error: false, data: result });
    }

    static async competitions(req, res) {
        const result = await FootballService.competitions(req.query);

        res.json({ error: false, ...result });
    }

    static async competition(req, res) {
        const result = await FootballService.competition(req.params.id);

        res.json({ error: false, data: result });
    }

    static async coaches(req, res) {
        const result = await FootballService.coaches(req.query);

        res.json({ error: false, ...result });
    }

    static async coach(req, res) {
        const result = await FootballService.coach(req.params.id);

        res.json({ error: false, data: result });
    }
}

module.exports = FootballController;
