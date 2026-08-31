package ca.mohawk_college.wiselysplit_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class WiselySplitServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(WiselySplitServerApplication.class, args);
	}

}
