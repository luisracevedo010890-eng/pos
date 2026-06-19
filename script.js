// --- BASE DE DATOS LOCAL INICIAL ---
let inventario = [
    { id: "101", nombre: "Arroz 1kg", precioCompra: 2000, precioPublico: 2700, cantidadCompra: 50, stock: 5 },
    { id: "102", nombre: "Aceite 1L", precioCompra: 6000, precioPublico: 8100, cantidadCompra: 20, stock: 0 },
    { id: "103", nombre: "Leche 1L", precioCompra: 3000, precioPublico: 4050, cantidadCompra: 30, stock: 12 }
];

let carrito = [];
let totalVentasDelDia = 0;
const BASE_CAJA = 30000;

// Estructura limpia de denominaciones monetarias exigidas
const denominaciones =0;

// --- MANEJO DE NAVEGACIÓN ---
function irAPantalla(pantallaId) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(pantallaId).classList.add('activa');
    
    const btnVolver = document.getElementById('btn-volver');
    const titulo = document.getElementById('titulo-sistema');

    if(pantallaId === 'pantalla-menu') {
        btnVolver.style.display = 'none';
        titulo.innerText = "POS System Pro";
    } else {
        btnVolver.style.display = 'block';
        if(pantallaId === 'pantalla-ventas') titulo.innerText = "Registro de Ventas";
        if(pantallaId === 'pantalla-inventario') titulo.innerText = "Control de Inventario";
        if(pantallaId === 'pantalla-cierre') {
            titulo.innerText = "Cierre de Caja";
            calcularResumenCierre();
        }
    }
    actualizarInterfaces();
}

// --- SISTEMA AUTOMÁTICO DE INTERFACES Y ALERTAS ---
function actualizarInterfaces() {
    // Verificar Stocks en 0 y lanzar alertas inmediatamente
    inventario.forEach(prod => {
        if(parseInt(prod.stock) === 0) {
            if(!prod.alertaLanzada) {
                alert(`⚠️ ALERTA: El producto "${prod.nombre}" (ID: ${prod.id}) tiene STOCK IGUAL A 0.`);
                prod.alertaLanzada = true; 
            }
        } else {
            prod.alertaLanzada = false;
        }
    });

    // 1. Renderizar Botones de Venta (Pantalla 2)
    const gridPos = document.getElementById('pos-grid-productos');
    if (gridPos) {
        gridPos.innerHTML = "";
        inventario.forEach(prod => {
            const stockClase = prod.stock == 0 ? 'badge-rojo' : 'badge-verde';
            const div = document.createElement('div');
            div.className = "tarjeta-venta";
            div.onclick = () => agregarAlCarrito(prod.id);
            div.innerHTML = `
                <strong>${prod.nombre}</strong>
                <div style="color:#10b981; font-weight:bold; margin:4px 0;">$${prod.precioPublico.toLocaleString()}</div>
                <div class="${stockClase} stock-label">Stock: ${prod.stock}</div>
            `;
            gridPos.appendChild(div);
        });
    }

    // 2. Renderizar Tabla de Inventario (Pantalla 3)
    const tbodyInv = document.querySelector('#tabla-stock tbody');
    if (tbodyInv) {
        tbodyInv.innerHTML = "";
        inventario.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prod.id}</td>
                <td><strong>${prod.nombre}</strong></td>
                <td>$${prod.precioCompra.toLocaleString()}</td>
                <td style="color:#10b981; font-weight:bold;">$${prod.precioPublico.toLocaleString()}</td>
                <td>${prod.cantidadCompra}</td>
                <td class="${prod.stock == 0 ? 'badge-rojo' : ''}" style="font-weight:bold;">${prod.stock}</td>
            `;
            tbodyInv.appendChild(tr);
        });
    }

    renderizarCarrito();
}

// --- MÓDULO PANTALLA 2: REGISTRO DE VENTAS ---
function agregarAlCarrito(id) {
    const prodInv = inventario.find(p => p.id === id.toString());
    if (!prodInv) return;

    if (prodInv.stock <= 0) {
        alert("No es posible agregar el producto. Sin existencias en el inventario.");
        return;
    }

    const prodCart = carrito.find(p => p.id === id.toString());
    if (prodCart) {
        if (prodCart.cantidad < prodInv.stock) {
            prodCart.cantidad++;
        } else {
            alert("Se ha alcanzado el límite máximo disponible en stock.");
        }
    } else {
        carrito.push({
            id: prodInv.id,
            nombre: prodInv.nombre,
            precioPublico: prodInv.precioPublico,
            cantidad: 1
        });
    }
    actualizarInterfaces();
}

function cambiarCantidadCarrito(id, delta) {
    const item = carrito.find(p => p.id === id.toString());
    const prodInv = inventario.find(p => p.id === id.toString());
    if (!item || !prodInv) return;

    item.cantidad += delta;
    if(item.cantidad > prodInv.stock) {
        alert("Excede el stock real disponible.");
        item.cantidad = prodInv.stock;
    }

    if(item.cantidad <= 0) {
        carrito = carrito.filter(p => p.id !== id.toString());
    }
    actualizarInterfaces();
}

function renderizarCarrito() {
    const lista = document.getElementById('carrito-lista');
    if (!lista) return;
    lista.innerHTML = "";
    let subtotalGeneral = 0;

    carrito.forEach(item => {
        const subtotalProducto = item.precioPublico * item.cantidad;
        subtotalGeneral += subtotalProducto;

        const li = document.createElement('li');
        li.className = "item-carrito";
        li.innerHTML = `
            <div>
                <div><b>${item.nombre}</b></div>
                <small style="color:#64748b;">Sub: $${subtotalProducto.toLocaleString()}</small>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <button class="btn-remove" style="background:#cbd5e1; color:#333;" onclick="cambiarCantidadCarrito('${item.id}', -1)">-</button>
                <span>${item.cantidad}</span>
                <button class="btn-remove" style="background:#cbd5e1; color:#333;" onclick="cambiarCantidadCarrito('${item.id}', 1)">+</button>
                <button class="btn-remove" onclick="cambiarCantidadCarrito('${item.id}', -${item.cantidad})">❌</button>
            </div>
        `;
        lista.appendChild(li);
    });

    document.getElementById('venta-subtotal').innerHTML = `Subtotal: <span>$${subtotalGeneral.toLocaleString()}</span>`;
    document.getElementById('venta-total').innerHTML = `Total Final: <span>$${subtotalGeneral.toLocaleString()}</span>`;
}

function procesarVenta() {
    if (carrito.length === 0) return alert("El carrito de compras está vacío.");

    carrito.forEach(itemCart => {
        const itemInv = inventario.find(p => p.id === itemCart.id);
        if (itemInv) {
            itemInv.stock -= itemCart.cantidad;
            totalVentasDelDia += (itemCart.precioPublico * itemCart.cantidad);
        }
    });

    alert("Venta registrada con éxito.");
    carrito = [];
    actualizarInterfaces();
}

// --- MÓDULO PANTALLA 3: INVENTARIO & INTEGRACIÓN EXCEL ---
function calcularPrecioPublicoSugerido() {
    const compra = parseFloat(document.getElementById('inv-compra').value) || 0;
    const publico = compra * 1.35;
    document.getElementById('inv-publico').value = Math.round(publico);
}

function agregarProductoInventario(e) {
    e.preventDefault();
    const id = document.getElementById('inv-id').value.trim();
    const nombre = document.getElementById('inv-nombre').value.trim();
    const compra = parseFloat(document.getElementById('inv-compra').value);
    const cantidad = parseInt(document.getElementById('inv-cantidad').value);
    const publico = Math.round(compra * 1.35);

    const existente = inventario.find(p => p.id === id);
    if (existing = existente) {
        existente.cantidadCompra += cantidad;
        existente.stock += cantidad;
        existente.precioCompra = compra;
        existente.precioPublico = publico;
    } else {
        inventario.push({
            id: id,
            nombre: nombre,
            precioCompra: compra,
            precioPublico: publico,
            cantidadCompra: quantity = cantidad,
            stock: cantidad
        });
    }

    document.getElementById('form-nuevo-prod').reset();
    actualizarInterfaces();
}

function importarExcel(event) {
    const file = event.target.files;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const hoja = workbook.Sheets[workbook.SheetNames];
        const json = XLSX.utils.sheet_to_json(hoja);
        
        if (json.length > 0) {
            inventario = json.map(row => ({
                id: String(row.ID || row.id || ''),
                nombre: String(row.Nombre || row.nombre || ''),
                precioCompra: parseFloat(row.PrecioCompra || row.precioCompra || 0),
                precioPublico: parseFloat(row.PrecioPublico || row.precioPublico || 0),
                cantidadCompra: parseInt(row.CantidadCompra || row.cantidadCompra || 0),
                stock: parseInt(row.Stock || row.stock || 0)
            }));
            document.getElementById('estado-excel').innerText = `Archivo cargado: "${file.name}"`;
            actualizarInterfaces();
        }
    };
    reader.readAsArrayBuffer(file);
}

function exportarExcel() {
    const filasExcel = inventario.map(p => ({
        ID: p.id,
        Nombre: p.nombre,
        PrecioCompra: p.precioCompra,
        PrecioPublico: p.precioPublico,
        CantidadCompra: p.cantidadCompra,
        Stock: p.stock
    }));

    const hoja = XLSX.utils.json_to_sheet(filasExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Inventario");
    XLSX.writeFile(libro, "Inventario_DB.xlsx");
}

// --- MÓDULO PANTALLA 4: CIERRE DE CAJA ---
function generarInputsMonedas() {
    const contenedor = document.getElementById('grid-denominaciones');
    if (!contenedor) return;
    contenedor.innerHTML = "";
}
