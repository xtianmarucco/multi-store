const service = require('../services/dashboard.service')
const { handleError } = require('../utils/handleError')

const getSummary = async (req, res) => {
  try {
    const data = await service.getSummary(req.session.groupId)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getSummary }
