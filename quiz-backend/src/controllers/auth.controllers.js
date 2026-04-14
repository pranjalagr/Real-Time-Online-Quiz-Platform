import authService from '../services/auth.services.js';
import { ValidationError } from '../models/errors.js';

class AuthController {
    
    /**
     * Register Controller
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { email, password } = req.body;
            
            // Basic validation
            if (!email || !password) {
                return res.status(400).json({ error: "Please fill all the fields." });
            }
            
            if (password.length < 10) {
                return res.status(400).json({ error: "The password length must be greater than 9" });
            }
            
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Invalid email format" });
            }
            
            await authService.createUser(email, password);
            
            return res.status(201).json({
                success: true,
                message: "User registered successfully. Please login."
            });
        } catch (error) {
            console.error('Register error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            // Assuming auth service throws specific errors
            if (error.message.includes('already exists')) {
                return res.status(409).json({ error: "User already exists." });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Login Controller
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Basic validation
            if (!email || !password) {
                return res.status(400).json({ error: "Please fill all the fields." });
            }
            
            if (password.length < 10) {
                return res.status(400).json({ error: "The password length must be greater than 9" });
            }
            
            const result = await authService.authenticateUser(email, password);
            
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: result
            });
        } catch (error) {
            console.error('Login error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            // Assuming auth service throws specific errors
            if (error.message.includes('not found') || error.message.includes('invalid')) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    async guest(req, res) {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }

            const result = await authService.createGuestUser(username);

            return res.status(201).json({
                success: true,
                message: 'Guest session created',
                data: result
            });
        } catch (error) {
            console.error('Guest auth error:', error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new AuthController();
