function role(roleYangDiizinkan) {
    return function(req, res, next) {
        if (!req.user || req.user.role !== roleYangDiizinkan) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak'
            });
        }

        next();
    };
}

module.exports = role;