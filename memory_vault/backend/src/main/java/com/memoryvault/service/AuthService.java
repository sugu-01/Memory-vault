package com.memoryvault.service;

import com.memoryvault.dto.request.LoginRequest;
import com.memoryvault.dto.request.RegisterRequest;
import com.memoryvault.dto.request.TokenRefreshRequest;
import com.memoryvault.dto.response.JwtResponse;
import com.memoryvault.entity.RefreshToken;
import com.memoryvault.entity.User;
import com.memoryvault.exception.BadRequestException;
import com.memoryvault.exception.ResourceNotFoundException;
import com.memoryvault.repository.RefreshTokenRepository;
import com.memoryvault.repository.UserRepository;
import com.memoryvault.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public JwtResponse register(RegisterRequest req) {
        if (userRepository.existsByUsernameAndDeletedFalse(req.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmailAndDeletedFalse(req.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .displayName(req.getDisplayName() != null ? req.getDisplayName() : req.getUsername())
                .role(User.Role.USER)
                .build();
        user = userRepository.save(user);
        log.info("New user registered: {}", user.getUsername());

        return generateTokenPair(user);
    }

    @Transactional
    public JwtResponse login(LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
        );
        User user = userRepository.findByUsernameAndDeletedFalse(req.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return generateTokenPair(user);
    }

    @Transactional
    public JwtResponse refreshToken(TokenRefreshRequest req) {
        String requestRefreshToken = req.getRefreshToken();
        RefreshToken token = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new BadRequestException("Refresh token not found"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new BadRequestException("Refresh token expired. Please log in again.");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String newAccessToken = jwtUtils.generateAccessToken(user.getUsername());

        return JwtResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(requestRefreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
        log.info("User {} logged out, refresh tokens deleted", userId);
    }

    private JwtResponse generateTokenPair(User user) {
        // Delete any existing refresh tokens for this user
        refreshTokenRepository.deleteByUserId(user.getId());

        String accessToken = jwtUtils.generateAccessToken(user.getUsername());
        String refreshTokenStr = jwtUtils.generateRefreshToken(user.getUsername());

        LocalDateTime expiryDate = LocalDateTime.now()
                .plusSeconds(jwtUtils.getRefreshExpirationMs() / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshTokenStr)
                .expiryDate(expiryDate)
                .build();
        refreshTokenRepository.save(refreshToken);

        return JwtResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .build();
    }
}
