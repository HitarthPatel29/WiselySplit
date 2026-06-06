package ca.mohawkCollege.wiselySplitServer.utilities;

import ca.mohawkCollege.wiselySplitServer.daos.UserDAO;
import ca.mohawkCollege.wiselySplitServer.models.Role;
import ca.mohawkCollege.wiselySplitServer.models.User;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DaoUserDetailsService implements UserDetailsService {

    private final UserDAO userDAO;

    public DaoUserDetailsService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<User> opt = userDAO.findByEmail(email);
        User u = opt.orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Role is loaded fresh from the DB on every request (stateless JWT),
        // so role changes take effect immediately. .roles(X) yields authority ROLE_X.
        return org.springframework.security.core.userdetails.User
                .withUsername(u.getEmail())
                .password(u.getPassword())
                .roles(Role.normalize(u.getRole()))
                .build();
    }
}