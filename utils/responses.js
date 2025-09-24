const wrap = (success, data, meta) => ({ success, ...data !== undefined ? { data } : {}, ...meta ? { meta } : {} });
const ok = (res, data) => res.status(200).json(wrap(true, data));
const created = (res, data) => res.status(201).json(wrap(true, data));
module.exports = { ok, created };
