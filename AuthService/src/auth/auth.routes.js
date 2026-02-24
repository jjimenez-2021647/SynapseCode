import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    authRateLimit,
    requestLimit,
} from '../../middlewares/request-limit.js';
import { upload, handleUploadError } from '../../helpers/file-upload.js';
import {
    validateRegister,
    validateLogin,
    validateVerifyEmail,
    validateResendVerification,
    validateForgotPassword,
    validateResetPassword,
} from '../../middlewares/validation.js';

const router = Router();

router.post(
    '/register',
    authRateLimit,
    upload.single('profilePicture'),
    handleUploadError,
    validateRegister,
    authController.register
);

router.post('/login', authRateLimit, validateLogin, authController.login);

router.post(
    '/verify-email',
    requestLimit,
    validateVerifyEmail,
    authController.verifyEmail
);

router.post(
    '/resend-verification',
    authRateLimit,
    validateResendVerification,
    authController.resendVerification
);

router.post(
    '/forgot-password',
    authRateLimit,
    validateForgotPassword,
    authController.forgotPassword
);

router.post(
    '/reset-password',
    authRateLimit,
    validateResetPassword,
    authController.resetPassword
);

router.get('/profile', validateJWT, authController.getProfile);
router.post('/profile/by-id', requestLimit, authController.getProfileById);

router.post('/logout', authRateLimit, validateJWT, authController.logout);
router.put('/change-password', authRateLimit, validateJWT, authController.changePassword);

// profile updates
router.put('/profile', requestLimit, validateJWT, authController.updateProfile);
router.put('/profile/image', requestLimit, validateJWT, upload.single('profilePicture'), handleUploadError, authController.changeImage);

// username change
router.put('/profile/username', authRateLimit, validateJWT, authController.requestUsernameChange);
router.post('/profile/username/confirm', authRateLimit, validateJWT, authController.confirmUsernameChange);

// phone change
router.put('/profile/phone', authRateLimit, validateJWT, authController.requestPhoneChange);
router.post('/profile/phone/confirm', authRateLimit, validateJWT, authController.confirmPhoneChange);

// desactivate account
router.post('/deactivate', authRateLimit, validateJWT, authController.requestDeactivateAccount);
router.post('/deactivate/confirm', authRateLimit, validateJWT, authController.confirmDeactivateAccount);

// acctivate account
router.post('/activate', authRateLimit, authController.requestActivateAccount);
router.post('/activate/confirm', authRateLimit, authController.confirmActivateAccount);
    
export default router;