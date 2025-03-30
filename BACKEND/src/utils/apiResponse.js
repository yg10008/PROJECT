class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static error(res, message = 'Error') {
        return res.status(500).json({
            success: false,
            message
        });
    }
} 