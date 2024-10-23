const express = require('express');
const AvatarController = require('../controllers/AvatarController');

const router = express.Router();

router.post('/emotion', AvatarController.setEmotion);
router.post('/animation', AvatarController.setAnimation);
router.post('/audio', AvatarController.setAudio);

module.exports = router;
