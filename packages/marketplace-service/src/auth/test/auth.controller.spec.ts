import { AuthService } from "../auth.service";
import { AuthController } from "../auth.controller";

@describe('AuthController', () => {
    let authController: AuthController;
    let authSerivce:AuthService;
    beforeEach(() => {});
    describe('getSignMessage', () => {
        it('should return a message', async () => {
            const address = '0x123456789';
            const nonce = 1;
            const message = await authController.getSignMessage(address, nonce);
            expect(message).toBeDefined();
        });
    });
}); 
