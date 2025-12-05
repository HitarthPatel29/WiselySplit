import React from 'react'

function DollarIcon(props) {
  return (
    <svg
      fill='#10b981'
      width='1000px'
      height='1000px'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        fillRule='evenodd'
        d='M7,8.5 C7,6.29584229 8.73751171,4.50141712 11.0052145,4.08920503 L11.0011675,4.04546297 L11.0011675,4.04546297 L11,3 C11,2.44771525 11.4477153,2 12,2 C12.5522847,2 13,2.44771525 13,3 L13,4 L12.9957846,4.08938673 C15.2629986,4.5019442 17,6.29616601 17,8.5 C17,9.05228475 16.5522847,9.5 16,9.5 C15.4871642,9.5 15.0644928,9.11395981 15.0067277,8.61662113 L15,8.5 C15,7.15119434 13.6843493,6 12,6 C10.3156507,6 9,7.15119434 9,8.5 C9,9.79884989 10.2199998,10.9144553 11.8144155,10.995311 L12,11 C14.7339287,11 17,12.9828124 17,15.5 C17,17.7022154 15.2655491,19.4954201 13.0007791,19.909702 L13,21 C13,21.5522847 12.5522847,22 12,22 C11.4477153,22 11,21.5522847 11,21 L11.0002197,19.9098846 C8.73496086,19.4959473 7,17.7025391 7,15.5 C7,14.9477153 7.44771525,14.5 8,14.5 C8.55228475,14.5 9,14.9477153 9,15.5 C9,16.8488057 10.3156507,18 12,18 C13.6843493,18 15,16.8488057 15,15.5 C15,14.2011501 13.7800002,13.0855447 12.1855845,13.004689 L12,13 C9.26607132,13 7,11.0171876 7,8.5 Z'
      />
    </svg>
  )
}

function SlashIcon(props) {
  return (
    <svg
      width='800px'
      height='800px'
      viewBox='0 0 15 15'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M4.10876 14L9.46582 1H10.8178L5.46074 14H4.10876Z'
        fill='#10b981'
      />
    </svg>
  )
}

function AnimatedDollarSlashLogo({ onAnimationComplete }) {
  const styles = `
    .logo-root {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeOut 0.8s ease-out forwards;
      animation-delay: 2s;
    }
    @media (prefers-color-scheme: dark) {
      .logo-root {
        background: #111827;
      }
    }
    .logo-container {
      position: relative;
      width: 200px;
      height: 200px;
    }
    .dollar-icon {
      position: absolute;
      inset: 0;
      margin: auto;
      width: 160px;
      height: 160px;
      opacity: 0;
      transform: scale(0.5);
      animation: dollarFadeScale 1.2s ease-out forwards;
    }
    .slash-icon {
      position: absolute;
      width: 150px;
      height: 150px;
      bottom: 0;
      left: 0;
      opacity: 0;
      transform: translate(-100%, 100%);
      animation: slashMove 0.1s forwards;
      animation-delay: 1.3s;
    }
    @keyframes dollarFadeScale {
      0% { opacity: 0; transform: scale(0.5); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes slashMove {
      0% { opacity: 1; transform: translate(-100%, 100%); }
      100% { opacity: 1; transform: translate(15%, -15%); }
    }
    @keyframes fadeOut {
      0% { opacity: 1; }
      100% { opacity: 0; visibility: hidden; }
    }
  `;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2600); // Total animation time: 2s + 0.1s + 0.5s fade out

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className='logo-root'>
      <style>{styles}</style>
      <div className='logo-container'>
        <DollarIcon className='dollar-icon' />
        <SlashIcon className='slash-icon' />
      </div>
    </div>
  );
}

export default AnimatedDollarSlashLogo;

