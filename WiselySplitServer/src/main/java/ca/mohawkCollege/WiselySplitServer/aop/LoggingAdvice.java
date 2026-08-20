package ca.mohawkCollege.wiselySplitServer.aop;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;

@Aspect
@Slf4j
public class LoggingAdvice{

    private static final Logger logger = LoggerFactory.getLogger(LoggingAdvice.class);

    @Pointcut("execution(* ca.mohawkCollge.wiselySplitServer.*.*.*(..))")
    public void myPointCut(){}

    @Around("myPointCut()")
    public Object loggingAdvice(ProceedingJoinPoint pjp) throws Throwable{

        String className = pjp.getTarget().getClass().getName();
        String methodName = pjp.getSignature().getName();

        Object[] args = pjp.getArgs();
        ObjectMapper objMapper = new ObjectMapper();
        String stringArgs = objMapper.writeValueAsString(args);

        logger.info( "{} ,Class: {}, Method: {} started execution with parameters: {}",Instant.now(), className, methodName, stringArgs );

        // proceed with the method execution and get the return data.
        Object returnData = pjp.proceed();

        String stringReturnData = objMapper.writeValueAsString(returnData);
        logger.info( "{} ,Class: {}, Method: {} finished execution with return: {}",Instant.now(), className, methodName, stringReturnData );

        return returnData;

    }
}
