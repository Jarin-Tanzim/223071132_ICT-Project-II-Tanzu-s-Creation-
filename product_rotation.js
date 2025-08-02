document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.rotator-container img');
    let currentIndex = 0;
    
    function rotateProducts() {
       
        images[currentIndex].classList.remove('active');
        
       
        currentIndex = (currentIndex + 1) % images.length;
        
     
        images[currentIndex].classList.add('active');
    }
    
    
    setInterval(rotateProducts, 3000);
    
   
    images[0].classList.add('active');
});
