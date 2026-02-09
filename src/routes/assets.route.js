import express from 'express'
import assetsController from '../controllers/assets.controller.js'
import { requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/my-assets', requirePermission('leave', 'read'), assetsController.getMyAssets)
router.get('/summary', requirePermission('dashboard', 'read'), assetsController.getAssetSummary)
router.get('/', requirePermission('dashboard', 'read'), assetsController.listAssets)
router.post('/', requirePermission('settings', 'create'), assetsController.createAsset)
router.put('/:id', requirePermission('settings', 'edit'), assetsController.updateAsset)
router.delete('/:id', requirePermission('settings', 'delete'), assetsController.deleteAsset)
router.post('/:id/assign', requirePermission('settings', 'edit'), assetsController.assignAsset)
router.post('/:id/return', requirePermission('settings', 'edit'), assetsController.returnAsset)

export default router
