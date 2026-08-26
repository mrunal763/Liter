package com.liter;

import com.liter.model.User;
import com.liter.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class LiterApplication {

    public static void main(String[] args) {
        SpringApplication.run(LiterApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed a default admin user if the database is empty
            if (userRepository.count() == 0) {
                User defaultUser = new User();
                defaultUser.setUsername("admin");
                defaultUser.setPassword(passwordEncoder.encode("admin123"));
                defaultUser.setEmail("admin@liter.com");
                defaultUser.setFullName("Krishna Patil");
                defaultUser.setRole("ROLE_OWNER");
                defaultUser.setActive(true);

                userRepository.save(defaultUser);
                System.out.println(">>> Default owner user created: admin / admin123");
            }
        };
    }
}
