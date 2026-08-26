package com.liter.repository;

import com.liter.model.Product;
import com.liter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActive(boolean active);

    List<Product> findByUser(User user);

    List<Product> findByUserAndActive(User user, boolean active);

    Optional<Product> findByIdAndUser(Long id, User user);
}

