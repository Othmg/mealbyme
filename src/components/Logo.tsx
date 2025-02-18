import React from 'react';

export function Logo() {
  return (
    <div className="flex justify-center w-full">
      <a href="https://www.mealbyme.com" className="block hover:opacity-90 transition-opacity">
        <svg width="524" height="101" viewBox="0 0 524 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 sm:h-16 w-auto mb-4">
          <path d="M31.209 76L14.0215 19.9941H13.582C13.6471 21.3288 13.7448 23.347 13.875 26.0488C14.0378 28.7181 14.1842 31.5664 14.3145 34.5938C14.4447 37.6211 14.5098 40.3555 14.5098 42.7969V76H0.984375V4.61328H21.5898L38.4844 59.2031H38.7773L56.6973 4.61328H77.3027V76H63.1914V42.2109C63.1914 39.9648 63.224 37.377 63.2891 34.4473C63.3867 31.5176 63.5007 28.7344 63.6309 26.0977C63.7611 23.4284 63.8587 21.4264 63.9238 20.0918H63.4844L45.0762 76H31.209ZM118.658 20.3848C123.704 20.3848 128.049 21.3613 131.695 23.3145C135.341 25.235 138.157 28.0345 140.143 31.7129C142.128 35.3913 143.121 39.8835 143.121 45.1895V52.416H107.916C108.079 56.6152 109.332 59.9193 111.676 62.3281C114.052 64.7044 117.34 65.8926 121.539 65.8926C125.022 65.8926 128.212 65.5345 131.109 64.8184C134.007 64.1022 136.985 63.028 140.045 61.5957V73.1191C137.343 74.4538 134.511 75.4303 131.549 76.0488C128.619 76.6673 125.055 76.9766 120.855 76.9766C115.387 76.9766 110.536 75.9674 106.305 73.9492C102.105 71.931 98.8014 68.8548 96.3926 64.7207C94.0163 60.5866 92.8281 55.3783 92.8281 49.0957C92.8281 42.7155 93.9023 37.4095 96.0508 33.1777C98.2318 28.9134 101.259 25.7233 105.133 23.6074C109.007 21.459 113.515 20.3848 118.658 20.3848ZM118.756 30.9805C115.859 30.9805 113.45 31.9082 111.529 33.7637C109.641 35.6191 108.551 38.5326 108.258 42.5039H129.156C129.124 40.2904 128.717 38.321 127.936 36.5957C127.187 34.8704 126.048 33.5033 124.518 32.4941C123.02 31.485 121.1 30.9805 118.756 30.9805ZM179.594 20.2871C186.918 20.2871 192.533 21.8822 196.439 25.0723C200.346 28.2624 202.299 33.1126 202.299 39.623V76H191.898L189.018 68.5781H188.627C187.064 70.5312 185.469 72.1263 183.842 73.3633C182.214 74.6003 180.342 75.5117 178.227 76.0977C176.111 76.6836 173.539 76.9766 170.512 76.9766C167.289 76.9766 164.392 76.3581 161.82 75.1211C159.281 73.8841 157.279 71.9961 155.814 69.457C154.35 66.8854 153.617 63.6302 153.617 59.6914C153.617 53.8971 155.652 49.6328 159.721 46.8984C163.79 44.1315 169.893 42.6016 178.031 42.3086L187.504 42.0156V39.623C187.504 36.7585 186.755 34.6589 185.258 33.3242C183.76 31.9896 181.677 31.3223 179.008 31.3223C176.371 31.3223 173.783 31.6966 171.244 32.4453C168.705 33.194 166.166 34.138 163.627 35.2773L158.695 25.2188C161.592 23.6888 164.831 22.4844 168.412 21.6055C172.025 20.7266 175.753 20.2871 179.594 20.2871ZM187.504 50.707L181.742 50.9023C176.924 51.0326 173.572 51.8952 171.684 53.4902C169.828 55.0853 168.9 57.1849 168.9 59.7891C168.9 62.0677 169.568 63.6953 170.902 64.6719C172.237 65.6159 173.979 66.0879 176.127 66.0879C179.317 66.0879 182.003 65.1439 184.184 63.2559C186.397 61.3678 187.504 58.6823 187.504 55.1992V50.707ZM234.572 76H219.68V0.0234375H234.572V76ZM253.418 4.61328H275.635C285.14 4.61328 292.334 5.94792 297.217 8.61719C302.1 11.2865 304.541 15.974 304.541 22.6797C304.541 25.3815 304.102 27.8229 303.223 30.0039C302.376 32.1849 301.139 33.9753 299.512 35.375C297.884 36.7747 295.898 37.6862 293.555 38.1094V38.5977C295.931 39.0859 298.079 39.9323 300 41.1367C301.921 42.3086 303.451 44.0339 304.59 46.3125C305.762 48.5586 306.348 51.5534 306.348 55.2969C306.348 59.6263 305.29 63.3372 303.174 66.4297C301.058 69.5221 298.031 71.8984 294.092 73.5586C290.186 75.1862 285.531 76 280.127 76H253.418V4.61328ZM268.555 32.8848H277.344C281.738 32.8848 284.782 32.2012 286.475 30.834C288.167 29.4342 289.014 27.3835 289.014 24.6816C289.014 21.9473 288.005 19.9941 285.986 18.8223C284.001 17.6178 280.843 17.0156 276.514 17.0156H268.555V32.8848ZM268.555 44.8965V63.5H278.418C282.975 63.5 286.149 62.6211 287.939 60.8633C289.73 59.1055 290.625 56.7454 290.625 53.7832C290.625 52.0254 290.234 50.4792 289.453 49.1445C288.672 47.8099 287.354 46.7682 285.498 46.0195C283.675 45.2708 281.152 44.8965 277.93 44.8965H268.555ZM313.621 21.4102H329.93L340.232 52.123C340.558 53.0996 340.835 54.0924 341.062 55.1016C341.29 56.1107 341.486 57.1523 341.648 58.2266C341.811 59.3008 341.941 60.4238 342.039 61.5957H342.332C342.527 59.8379 342.788 58.194 343.113 56.6641C343.471 55.1341 343.911 53.6204 344.432 52.123L354.539 21.4102H370.506L347.41 82.9824C346.01 86.7585 344.188 89.8997 341.941 92.4062C339.695 94.9453 337.107 96.8496 334.178 98.1191C331.281 99.3887 328.09 100.023 324.607 100.023C322.915 100.023 321.45 99.9258 320.213 99.7305C318.976 99.5677 317.918 99.3887 317.039 99.1934V87.377C317.723 87.5397 318.585 87.6862 319.627 87.8164C320.669 87.9466 321.759 88.0117 322.898 88.0117C324.982 88.0117 326.772 87.5723 328.27 86.6934C329.767 85.8145 331.02 84.6263 332.029 83.1289C333.038 81.6641 333.836 80.0527 334.422 78.2949L335.301 75.6094L313.621 21.4102ZM411.764 76L394.576 19.9941H394.137C394.202 21.3288 394.299 23.347 394.43 26.0488C394.592 28.7181 394.739 31.5664 394.869 34.5938C394.999 37.6211 395.064 40.3555 395.064 42.7969V76H381.539V4.61328H402.145L419.039 59.2031H419.332L437.252 4.61328H457.857V76H443.746V42.2109C443.746 39.9648 443.779 37.377 443.844 34.4473C443.941 31.5176 444.055 28.7344 444.186 26.0977C444.316 23.4284 444.413 21.4264 444.479 20.0918H444.039L425.631 76H411.764ZM499.213 20.3848C504.258 20.3848 508.604 21.3613 512.25 23.3145C515.896 25.235 518.712 28.0345 520.697 31.7129C522.683 35.3913 523.676 39.8835 523.676 45.1895V52.416H488.471C488.633 56.6152 489.887 59.9193 492.23 62.3281C494.607 64.7044 497.895 65.8926 502.094 65.8926C505.577 65.8926 508.767 65.5345 511.664 64.8184C514.561 64.1022 517.54 63.028 520.6 61.5957V73.1191C517.898 74.4538 515.066 75.4303 512.104 76.0488C509.174 76.6673 505.609 76.9766 501.41 76.9766C495.941 76.9766 491.091 75.9674 486.859 73.9492C482.66 71.931 479.356 68.8548 476.947 64.7207C474.571 60.5866 473.383 55.3783 473.383 49.0957C473.383 42.7155 474.457 37.4095 476.605 33.1777C478.786 28.9134 481.814 25.7233 485.688 23.6074C489.561 21.459 494.07 20.3848 499.213 20.3848ZM499.311 30.9805C496.413 30.9805 494.005 31.9082 492.084 33.7637C490.196 35.6191 489.105 38.5326 488.812 42.5039H509.711C509.678 40.2904 509.271 38.321 508.49 36.5957C507.742 34.8704 506.602 33.5033 505.072 32.4941C503.575 31.485 501.654 30.9805 499.311 30.9805Z" fill="url(#paint0_linear_112_86)"/>
          <defs>
            <linearGradient id="paint0_linear_112_86" x1="-17.5407" y1="25.518" x2="537.705" y2="25.518" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B6B"/>
              <stop offset="1" stopColor="#FFB400"/>
            </linearGradient>
          </defs>
        </svg>
      </a>
    </div>
  );
}