const express = require('express');
const api = express.Router();

const SubtitlesService = require('../services/subtitles.service');

api.get('/transformSrtToVtt', SubtitlesService.transformSrtToVtt);
module.exports = api;