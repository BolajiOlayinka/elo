const { UploadService } = require('./upload.service');

class UploadController {
    static async create(req, res) {
        const upload = await UploadService.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Upload saved',
            data: upload
        });
    }
}

module.exports = UploadController;
