package ca.mohawkCollege.wiselySplitServer.configs;

import ca.mohawkCollege.wiselySplitServer.utilities.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    SecurityFilterChain apiFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/me").authenticated() // caller's own profile + role (must precede /api/auth/**)
                        .requestMatchers("/api/auth/reset/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()   // login/reset open
                        .requestMatchers(HttpMethod.POST, "/api/users").permitAll() // signup
                        .requestMatchers(HttpMethod.GET, "/api/users/check-username").permitAll() // username availability check
                        .requestMatchers(HttpMethod.GET, "/api/users/check-email").permitAll() // email availability check
                        .requestMatchers(HttpMethod.POST, "/api/payments/webhook").permitAll() // Stripe webhook
                        .requestMatchers(HttpMethod.POST, "/api/expenses/personal/automation").permitAll() // Expenses Entry Automation API
                        // --- RBAC: admin-only surfaces ---
                        .requestMatchers("/api/admin/**").hasRole("ADMIN") // account management
                        // classifier: predict + feedback are part of the normal expense flow
                        .requestMatchers(HttpMethod.GET, "/api/classify/predict").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/classify/feedback").authenticated()
                        // everything else under /api/classify is admin-only (retrain, models, stats, etc.)
                        .requestMatchers("/api/classify/**").hasRole("ADMIN")
                        .anyRequest().authenticated()                  // everything else needs JWT
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(restAuthenticationEntryPoint())
                        .accessDeniedHandler(restAccessDeniedHandler())
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /** 401 JSON for unauthenticated requests to protected endpoints. */
    @Bean
    AuthenticationEntryPoint restAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(401);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Authentication required\"}");
        };
    }

    /** 403 JSON when an authenticated user lacks the required role. */
    @Bean
    AccessDeniedHandler restAccessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(403);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Access denied: insufficient role\"}");
        };
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns("http://localhost:5173", "https://wiselysplit.netlify.app", "https://wiselysplit.xyz")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}