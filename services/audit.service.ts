import {Audit} from "@/models/Audit"

export async function createAuditLog({
    userId,
    action,
    ip,
    role,
    details
}: any) {
    await Audit.create({
        userId,
        action,
        ip,
        role,
        details,
    })
}