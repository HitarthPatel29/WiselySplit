package ca.mohawkCollege.WiselySplitServer.Security;

import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.model.User;
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

        // simple role mapping; adjust if you add roles later
        return org.springframework.security.core.userdetails.User
                .withUsername(u.getEmail())
                .password(u.getPassword())
                .roles("USER")
                .build();
    }
}