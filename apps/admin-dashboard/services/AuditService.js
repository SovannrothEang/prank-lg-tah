/**
 * Audit Logging Service
 * Ensures every change is traceable for compliance and security.
 */

class AuditService {
    constructor(db) {
        this.db = db;
    }

    async log(userId, action, tableName, recordId, oldValue = null, newValue = null, ipAddress = '0.0.0.0') {
        try {
            await this.db.run(`
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                action,
                tableName,
                recordId,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                ipAddress
            ]);
        } catch (error) {
            console.error('[AUDIT_ERROR]: Failed to persist audit log', error);
        }
    }
}

module.exports = AuditService;
