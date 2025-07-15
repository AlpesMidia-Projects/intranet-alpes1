document.addEventListener('DOMContentLoaded', function() {
    
    document.body.addEventListener('click', function(event) {
        if (event.target.matches('#botao-menu') || event.target.closest('#botao-menu')) {
            const menuContainer = document.getElementById('menu-container');
            if (menuContainer) {
                menuContainer.classList.toggle('ativo');
            }
        }
    });
});