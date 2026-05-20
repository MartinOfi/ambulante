  1) [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:33:7 › UC-CLI-09 — estado ENVIADO del pedido › página de tracking muestra paso ENVIADO activo 

    TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
    =========================== logs ===========================
    waiting for navigation to "**/orders/**" until "domcontentloaded"
    ============================================================

      26 |   const cart = new CartDrawer(page);
      27 |   await cart.submitOrder();
    > 28 |   await page.waitForURL("**/orders/**", { timeout: 20_000, waitUntil: "domcontentloaded" });
         |              ^
      29 | }
      30 |
      31 | // UC-CLI-09: Ver estado inicial del pedido (ENVIADO)
        at submitOrderAndLand (/Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:28:14)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:34:5

    Error Context: test-results/use-cases-02-cliente-pedid-9d7d0-muestra-paso-ENVIADO-activo-as-client/error-context.md

  2) [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:76:7 › UC-CLI-13 — confirmar EN_CAMINO por cliente › botón confirmar camino transiciona a EN_CAMINO 

    TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
    =========================== logs ===========================
    waiting for navigation to "**/map**" until "domcontentloaded"
    ============================================================

      89 |       await clientPage.getByLabel(/contraseña/i).fill(E2E_USERS.client.password);
      90 |       await clientPage.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
    > 91 |       await clientPage.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });
         |                        ^
      92 |
      93 |       const map = new MapPage(clientPage);
      94 |       await map.expandBottomSheet();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:91:24

    Error Context: test-results/use-cases-02-cliente-pedid-70454-ino-transiciona-a-EN-CAMINO-as-client/error-context.md

  3) [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:149:7 › UC-CLI-14 — estado FINALIZADO › pedido finalizado muestra paso FINALIZADO 

    TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
    =========================== logs ===========================
    waiting for navigation to "**/orders/**" until "domcontentloaded"
    ============================================================

      26 |   const cart = new CartDrawer(page);
      27 |   await cart.submitOrder();
    > 28 |   await page.waitForURL("**/orders/**", { timeout: 20_000, waitUntil: "domcontentloaded" });
         |              ^
      29 | }
      30 |
      31 | // UC-CLI-09: Ver estado inicial del pedido (ENVIADO)
        at submitOrderAndLand (/Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:28:14)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:150:5

    Error Context: test-results/use-cases-02-cliente-pedid-9d314-ado-muestra-paso-FINALIZADO-as-client/error-context.md

  4) [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:160:7 › UC-CLI-15 — estado RECHAZADO › pedido rechazado por tienda muestra estado RECHAZADO 

    TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
    =========================== logs ===========================
    waiting for navigation to "**/map**" until "domcontentloaded"
    ============================================================

      173 |       await clientPage.getByLabel(/contraseña/i).fill(E2E_USERS.client.password);
      174 |       await clientPage.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
    > 175 |       await clientPage.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });
          |                        ^
      176 |
      177 |       const map = new MapPage(clientPage);
      178 |       await map.expandBottomSheet();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:175:24

    Error Context: test-results/use-cases-02-cliente-pedid-627ac-da-muestra-estado-RECHAZADO-as-client/error-context.md

  5) [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:229:7 › UC-CLI-16 — estado EXPIRADO (cron) › después de llamar al cron el pedido pasa a EXPIRADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByTestId('step-EXPIRADO')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByTestId('step-EXPIRADO')


      233 |     });
      234 |     const tracking = new OrderTrackingPage(page);
    > 235 |     await expect(tracking.statusStep("EXPIRADO")).toBeVisible({
          |                                                   ^
      236 |       timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      237 |     });
      238 |   });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:235:51

    Error Context: test-results/use-cases-02-cliente-pedid-3be81-n-el-pedido-pasa-a-EXPIRADO-as-client/error-context.md

  6) [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:243:7 › UC-CLI-17 — historial de pedidos › historial muestra pedidos anteriores del cliente 

    TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
    Call log:
      - waiting for getByRole('toolbar', { name: /filtrar por estado/i }) to be visible


       at use-cases/page-objects/OrderTrackingPage.ts:62

      60 |     await this.page
      61 |       .getByRole("toolbar", { name: /filtrar por estado/i })
    > 62 |       .waitFor({ state: "visible", timeout: 20_000 });
         |        ^
      63 |     // After toolbar appears the fetch may still be in-flight (two-step auth emits two
      64 |     // clientIds in quick succession). Wait for any loading skeleton to disappear so we
      65 |     // don't resolve during the brief isLoading=false window between the two emits.
        at OrderHistoryPage.waitForReady (/Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/page-objects/OrderTrackingPage.ts:62:8)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:247:19

    Error Context: test-results/use-cases-02-cliente-pedid-b7302-idos-anteriores-del-cliente-as-client/error-context.md

  7) [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:251:7 › UC-CLI-17 — historial de pedidos › filtrar por estado CANCELADO filtra la lista 

    Error: expect(locator).toBeVisible() failed

    Locator: locator('[data-order-status=\'CANCELADO\']').first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for locator('[data-order-status=\'CANCELADO\']').first()


      255 |     await history.waitForReady();
      256 |     await history.filterByStatus("CANCELADO");
    > 257 |     await expect(page.locator("[data-order-status='CANCELADO']").first()).toBeVisible({
          |                                                                           ^
      258 |       timeout: 15_000,
      259 |     });
      260 |   });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:257:75

    Error Context: test-results/use-cases-02-cliente-pedid-35668-o-CANCELADO-filtra-la-lista-as-client/error-context.md

  8) [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:12:7 › UC-STO-11 — ver catálogo › catálogo muestra productos existentes de la tienda 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('article').first()
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByRole('article').first()


      15 |     await catalog.goto();
      16 |     // La tienda seed tiene al menos un producto
    > 17 |     await expect(page.getByRole("article").first()).toBeVisible({ timeout: 8_000 });
         |                                                     ^
      18 |   });
      19 | });
      20 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/catalogo.uc.spec.ts:17:53

    Error Context: test-results/use-cases-03-tienda-catalo-f9e89-tos-existentes-de-la-tienda-as-store/error-context.md

  9) [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:23:7 › UC-STO-12 — agregar producto › crear producto válido lo muestra en el catálogo 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('article').filter({ hasText: 'Empanada de carne' })
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByRole('article').filter({ hasText: 'Empanada de carne' })


      32 |     // Navegar al catálogo para verificar que aparece
      33 |     await catalog.goto();
    > 34 |     await expect(catalog.productCard(CATALOG_TEST_PRODUCT.new.name)).toBeVisible({
         |                                                                      ^
      35 |       timeout: 8_000,
      36 |     });
      37 |   });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/catalogo.uc.spec.ts:34:70

    Error Context: test-results/use-cases-03-tienda-catalo-88f11-o-lo-muestra-en-el-catálogo-as-store/error-context.md

  10) [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:62:7 › UC-STO-13 — editar producto › editar producto actualiza los datos en el catálogo 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('article').first().getByRole('button', { name: /editar/i })


      66 |     // Usar el primer producto del catálogo seed
      67 |     const firstProductCard = page.getByRole("article").first();
    > 68 |     await firstProductCard.getByRole("button", { name: /editar/i }).click();
         |                                                                     ^
      69 |     const newName = CATALOG_TEST_PRODUCT.updated.name;
      70 |     await catalog.nameInput.clear();
      71 |     await catalog.nameInput.fill(newName);
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/catalogo.uc.spec.ts:68:69

    Error Context: test-results/use-cases-03-tienda-catalo-45672-za-los-datos-en-el-catálogo-as-store/error-context.md

  11) [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:81:7 › UC-STO-14 — eliminar producto › eliminar producto lo quita del catálogo 

    Test timeout of 30000ms exceeded.

    Error: locator.textContent: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('article').first().getByRole('heading')


      85 |     // Usar el primer producto
      86 |     const firstCard = page.getByRole("article").first();
    > 87 |     const productName = (await firstCard.getByRole("heading").textContent()) ?? "";
         |                                                               ^
      88 |     await firstCard.getByRole("button", { name: /eliminar/i }).click();
      89 |     await catalog.deleteConfirmButton.click();
      90 |     await expect(catalog.successToast).toBeVisible({ timeout: 10_000 });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/catalogo.uc.spec.ts:87:63

    Error Context: test-results/use-cases-03-tienda-catalo-592ec-ducto-lo-quita-del-catálogo-as-store/error-context.md

  12) [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:12:7 › UC-STO-07 — toggle de disponibilidad › toggle cambia el estado de disponibilidad 

    Error: expect(locator).toBeEnabled() failed

    Locator:  getByRole('region', { name: /estado/i }).getByRole('switch')
    Expected: enabled
    Received: disabled
    Timeout:  8000ms

    Call log:
      - Expect "toBeEnabled" with timeout 8000ms
      - waiting for getByRole('region', { name: /estado/i }).getByRole('switch')
        12 × locator resolved to <button disabled role="switch" aria-checked="false" aria-label="No disponible" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-muted cursor-not-allowed opacity-50">…</button>
           - unexpected value "disabled"


      15 |     await dashboard.goto();
      16 |     await expect(dashboard.availabilityToggle).toBeVisible({ timeout: 8_000 });
    > 17 |     await expect(dashboard.availabilityToggle).toBeEnabled({ timeout: 8_000 });
         |                                                ^
      18 |     const labelBefore = await dashboard.availabilityLabel.textContent();
      19 |     await dashboard.availabilityToggle.click();
      20 |     // El label debe cambiar tras el toggle
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/dashboard.uc.spec.ts:17:48

    Error Context: test-results/use-cases-03-tienda-dashbo-5b375-el-estado-de-disponibilidad-as-store/error-context.md

  13) [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:40:7 › UC-STO-09 — acceso al catálogo desde dashboard › link al catálogo navega a /store/catalog 

    Error: expect(page).toHaveURL(expected) failed

    Expected pattern: /store\/catalog/
    Received string:  "http://localhost:3100/store/pending-approval"
    Timeout: 8000ms

    Call log:
      - Expect "toHaveURL" with timeout 8000ms
        3 × unexpected value "http://localhost:3100/store/dashboard"
        9 × unexpected value "http://localhost:3100/store/pending-approval"


      44 |     await expect(dashboard.viewCatalogLink).toBeVisible({ timeout: 8_000 });
      45 |     await dashboard.viewCatalogLink.click();
    > 46 |     await expect(page).toHaveURL(/store\/catalog/, { timeout: 8_000 });
         |                        ^
      47 |   });
      48 | });
      49 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/dashboard.uc.spec.ts:46:24

    Error Context: test-results/use-cases-03-tienda-dashbo-cd191-logo-navega-a-store-catalog-as-store/error-context.md

  14) [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:67:7 › UC-STO-22 — ver perfil de la tienda › perfil muestra el nombre de la tienda 

    Error: expect(locator).toBeVisible() failed

    Locator: getByTestId('store-name')
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByTestId('store-name')


      69 |     const profile = new StoreProfilePage(page);
      70 |     await profile.goto();
    > 71 |     await expect(profile.storeNameDisplay).toBeVisible({ timeout: 8_000 });
         |                                            ^
      72 |     await expect(profile.storeNameDisplay).toContainText(E2E_USERS.store.name);
      73 |   });
      74 | });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/dashboard.uc.spec.ts:71:44

    Error Context: test-results/use-cases-03-tienda-dashbo-84885-stra-el-nombre-de-la-tienda-as-store/error-context.md

  15) [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:78:7 › UC-STO-23 — editar perfil de la tienda › guardar cambios en el perfil muestra feedback de éxito 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('button', { name: /editar.*perfil/i })


      80 |     const profile = new StoreProfilePage(page);
      81 |     await profile.goto();
    > 82 |     await profile.editProfileButton.click();
         |                                     ^
      83 |     await profile.taglineInput.fill("El mejor choripán del barrio");
      84 |     await profile.saveButton.click();
      85 |     await expect(profile.successToast).toBeVisible({ timeout: 8_000 });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/dashboard.uc.spec.ts:82:37

    Error Context: test-results/use-cases-03-tienda-dashbo-3e57e-l-muestra-feedback-de-éxito-as-store/error-context.md

  16) [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:91:7 › UC-STO-24 — analytics de la tienda › página de analytics muestra KPIs 

    Error: expect(locator).toBeVisible() failed

    Locator: getByTestId('kpi-total-orders')
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByTestId('kpi-total-orders')


      93 |     const analytics = new StoreAnalyticsPage(page);
      94 |     await analytics.goto();
    > 95 |     await expect(analytics.totalOrdersKpi).toBeVisible({ timeout: 8_000 });
         |                                            ^
      96 |     await expect(analytics.totalRevenueKpi).toBeVisible();
      97 |   });
      98 | });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/dashboard.uc.spec.ts:95:44

    Error Context: test-results/use-cases-03-tienda-dashbo-13112-a-de-analytics-muestra-KPIs-as-store/error-context.md

  17) [as-store] › e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:50:7 › UC-STO-18 — aceptar pedido entrante › aceptar primer pedido lo mueve a ACEPTADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('listitem').first().getByRole('link')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByRole('listitem').first().getByRole('link')


      67 |       const detail = new StoreOrderDetailPage(storePage);
      68 |       await orders.goto();
    > 69 |       await expect(orders.firstOrderCard).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
         |                                           ^
      70 |       await orders.clickFirstOrder();
      71 |       await expect(detail.acceptButton).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
      72 |       await detail.acceptButton.click();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:69:43

    Error Context: test-results/use-cases-03-tienda-pedido-ecb8d--pedido-lo-mueve-a-ACEPTADO-as-store/error-context.md

  18) [as-store] › e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:86:7 › UC-STO-19 — rechazar pedido › rechazar pedido lo mueve a RECHAZADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('listitem').first().getByRole('link')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByRole('listitem').first().getByRole('link')


      103 |       const detail = new StoreOrderDetailPage(storePage);
      104 |       await orders.goto();
    > 105 |       await expect(orders.firstOrderCard).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
          |                                           ^
      106 |       await orders.clickFirstOrder();
      107 |       await expect(detail.rejectButton).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
      108 |       await detail.rejectButton.click();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:105:43

    Error Context: test-results/use-cases-03-tienda-pedido-115c4-pedido-lo-mueve-a-RECHAZADO-as-store/error-context.md

  19) [as-store] › e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:122:7 › UC-STO-20 — finalizar pedido › finalizar pedido lo mueve a FINALIZADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('listitem').first().getByRole('link')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByRole('listitem').first().getByRole('link')


      142 |
      143 |       // Tienda abre detalle y acepta → ACEPTADO
    > 144 |       await expect(orders.firstOrderCard).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
          |                                           ^
      145 |       await orders.clickFirstOrder();
      146 |       await expect(detail.acceptButton).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
      147 |       await detail.acceptButton.click();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:144:43

    Error Context: test-results/use-cases-03-tienda-pedido-2bb87-edido-lo-mueve-a-FINALIZADO-as-store/error-context.md

  20) [as-admin] › e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:7:7 › UC-ADM-01 — dashboard de KPIs › dashboard muestra los 4 KPIs principales 

    Error: expect(locator).toBeVisible() failed

    Locator: getByTestId('kpi-active-stores')
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 10000ms
      - waiting for getByTestId('kpi-active-stores')


       9 |     const dashboard = new AdminDashboardPage(page);
      10 |     await dashboard.goto();
    > 11 |     await expect(dashboard.totalStoresKpi).toBeVisible({ timeout: 10_000 });
         |                                            ^
      12 |     await expect(dashboard.pendingStoresKpi).toBeVisible();
      13 |     await expect(dashboard.totalOrdersKpi).toBeVisible();
      14 |     await expect(dashboard.totalUsersKpi).toBeVisible();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:11:44

    Error Context: test-results/use-cases-04-admin-kpi-obs-c8157-stra-los-4-KPIs-principales-as-admin/error-context.md

  21) [as-admin] › e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:27:7 › UC-ADM-15 — audit log de pedidos › página de pedidos admin es accesible 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('table').or(getByRole('list'))
    Expected: visible
    Error: strict mode violation: getByRole('table').or(getByRole('list')) resolved to 2 elements:
        1) <ul class="flex flex-col gap-1 px-2">…</ul> aka getByText('DashboardPedidosModeració')
        2) <table class="w-full text-sm">…</table> aka getByText('IDEstadoFechaorder-demo-')

    Call log:
      - Expect "toBeVisible" with timeout 10000ms
      - waiting for getByRole('table').or(getByRole('list'))


      29 |     const orders = new AdminOrdersPage(page);
      30 |     await orders.goto();
    > 31 |     await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible({
         |                                                                      ^
      32 |       timeout: 10_000,
      33 |     });
      34 |   });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:31:70

    Error Context: test-results/use-cases-04-admin-kpi-obs-aebd6--pedidos-admin-es-accesible-as-admin/error-context.md

  22) [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:7:7 › UC-ADM-12 — cola de moderación › página de moderación carga correctamente 

    TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
    Call log:
      - waiting for getByRole('article').first().or(getByText(/no hay reportes pendientes/i)) to be visible


       at use-cases/page-objects/AdminPages.ts:161

      159 |       .first()
      160 |       .or(this.page.getByText(/no hay reportes pendientes/i))
    > 161 |       .waitFor({ timeout: 10_000 });
          |        ^
      162 |   }
      163 |
      164 |   get reportCard(): Locator {
        at AdminModerationPage.goto (/Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/page-objects/AdminPages.ts:161:8)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/moderacion.uc.spec.ts:10:5

    Error Context: test-results/use-cases-04-admin-moderac-b8593-eración-carga-correctamente-as-admin/error-context.md

  23) [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:19:7 › UC-ADM-13 — desestimar reporte › desestimar reporte muestra toast de confirmación 

    TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
    Call log:
      - waiting for getByRole('article').first().or(getByText(/no hay reportes pendientes/i)) to be visible


       at use-cases/page-objects/AdminPages.ts:161

      159 |       .first()
      160 |       .or(this.page.getByText(/no hay reportes pendientes/i))
    > 161 |       .waitFor({ timeout: 10_000 });
          |        ^
      162 |   }
      163 |
      164 |   get reportCard(): Locator {
        at AdminModerationPage.goto (/Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/page-objects/AdminPages.ts:161:8)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/moderacion.uc.spec.ts:22:5

    Error Context: test-results/use-cases-04-admin-moderac-e1584-estra-toast-de-confirmación-as-admin/error-context.md

  24) [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:35:7 › UC-ADM-14 — eliminar contenido reportado › eliminar contenido muestra toast de confirmación 

    TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
    Call log:
      - waiting for getByRole('article').first().or(getByText(/no hay reportes pendientes/i)) to be visible


       at use-cases/page-objects/AdminPages.ts:161

      159 |       .first()
      160 |       .or(this.page.getByText(/no hay reportes pendientes/i))
    > 161 |       .waitFor({ timeout: 10_000 });
          |        ^
      162 |   }
      163 |
      164 |   get reportCard(): Locator {
        at AdminModerationPage.goto (/Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/page-objects/AdminPages.ts:161:8)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/moderacion.uc.spec.ts:38:5

    Error Context: test-results/use-cases-04-admin-moderac-26702-estra-toast-de-confirmación-as-admin/error-context.md

  25) [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:48:7 › UC-ADM-14 — eliminar contenido reportado › cola vacía tras procesar todos los reportes 

    TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
    Call log:
      - waiting for getByRole('article').first().or(getByText(/no hay reportes pendientes/i)) to be visible


       at use-cases/page-objects/AdminPages.ts:161

      159 |       .first()
      160 |       .or(this.page.getByText(/no hay reportes pendientes/i))
    > 161 |       .waitFor({ timeout: 10_000 });
          |        ^
      162 |   }
      163 |
      164 |   get reportCard(): Locator {
        at AdminModerationPage.goto (/Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/page-objects/AdminPages.ts:161:8)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/moderacion.uc.spec.ts:51:5

    Error Context: test-results/use-cases-04-admin-moderac-575c2-procesar-todos-los-reportes-as-admin/error-context.md

  26) [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:20:7 › UC-ADM-08 — buscar usuario › buscar por nombre del cliente filtra resultados 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('row').filter({ hasText: 'Ana García' })
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByRole('row').filter({ hasText: 'Ana García' })


      23 |     await users.goto();
      24 |     await users.searchInput.fill(E2E_USERS.client.name);
    > 25 |     await expect(users.userRow(E2E_USERS.client.name)).toBeVisible({ timeout: 8_000 });
         |                                                        ^
      26 |   });
      27 | });
      28 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/usuarios.uc.spec.ts:25:56

    Error Context: test-results/use-cases-04-admin-usuario-30b28-l-cliente-filtra-resultados-as-admin/error-context.md

  27) [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:31:7 › UC-ADM-09 — filtrar por rol › filtro de rol actualiza la lista 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('row').nth(1)
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByRole('row').nth(1)


      35 |     await users.roleFilter.selectOption({ label: "Clientes" });
      36 |     // La lista debe mostrar solo clientes
    > 37 |     await expect(page.getByRole("row").nth(1)).toBeVisible({ timeout: 5_000 });
         |                                                ^
      38 |   });
      39 | });
      40 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/usuarios.uc.spec.ts:37:48

    Error Context: test-results/use-cases-04-admin-usuario-61f07-o-de-rol-actualiza-la-lista-as-admin/error-context.md

  28) [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:43:7 › UC-ADM-10 — suspender usuario › suspender usuario muestra badge de suspendido 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('row').filter({ hasText: 'Ana García' })


      45 |     const users = new AdminUsersPage(page);
      46 |     await users.goto();
    > 47 |     await users.userRow(E2E_USERS.client.name).click();
         |                                                ^
      48 |     await expect(users.suspendButton).toBeVisible({ timeout: 8_000 });
      49 |     await users.suspendButton.click();
      50 |     await users.confirmSuspendButton.click();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/usuarios.uc.spec.ts:47:48

    Error Context: test-results/use-cases-04-admin-usuario-b222c-muestra-badge-de-suspendido-as-admin/error-context.md

  29) [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:57:7 › UC-ADM-11 — reactivar usuario › reactivar usuario suspendido muestra badge activo 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('row').filter({ hasText: 'Ana García' })


      59 |     const users = new AdminUsersPage(page);
      60 |     await users.goto();
    > 61 |     await users.userRow(E2E_USERS.client.name).click();
         |                                                ^
      62 |     // Si está suspendido, reactivar; si no, verificar que el botón de reactivar existe como fallback
      63 |     const isSuspended = (await users.reactivateButton.count()) > 0;
      64 |     if (isSuspended) {
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/usuarios.uc.spec.ts:61:48

    Error Context: test-results/use-cases-04-admin-usuario-d2f07-endido-muestra-badge-activo-as-admin/error-context.md

  30) [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:75:7 › UC-ADM-11b — historial de pedidos de usuario › detalle del usuario muestra tabla de pedidos 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('row').filter({ hasText: 'Ana García' })


      77 |     const users = new AdminUsersPage(page);
      78 |     await users.goto();
    > 79 |     await users.userRow(E2E_USERS.client.name).click();
         |                                                ^
      80 |     await expect(users.ordersHistoryTable).toBeVisible({ timeout: 8_000 });
      81 |   });
      82 | });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/usuarios.uc.spec.ts:79:48

    Error Context: test-results/use-cases-04-admin-usuario-1203a-io-muestra-tabla-de-pedidos-as-admin/error-context.md

  31) [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:8:7 › UC-ADM-02 — ver tiendas pendientes de validación › pestaña pendientes muestra tiendas en espera 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('row').filter({ hasText: 'Empanadas La Porteña' })
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 10000ms
      - waiting for getByRole('row').filter({ hasText: 'Empanadas La Porteña' })


      11 |     await stores.goto();
      12 |     await stores.pendingTab.click();
    > 13 |     await expect(stores.storeRow(E2E_STORES.pending.name)).toBeVisible({ timeout: 10_000 });
         |                                                            ^
      14 |   });
      15 | });
      16 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:13:60

    Error Context: test-results/use-cases-04-admin-validac-6d6f6-s-muestra-tiendas-en-espera-as-admin/error-context.md

  32) [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:19:7 › UC-ADM-03 — buscar tienda por nombre › buscar por nombre filtra la lista de tiendas 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('row').filter({ hasText: 'Empanadas La Porteña' })
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByRole('row').filter({ hasText: 'Empanadas La Porteña' })


      22 |     await stores.goto();
      23 |     await stores.searchInput.fill(E2E_STORES.pending.name);
    > 24 |     await expect(stores.storeRow(E2E_STORES.pending.name)).toBeVisible({ timeout: 8_000 });
         |                                                            ^
      25 |   });
      26 | });
      27 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:24:60

    Error Context: test-results/use-cases-04-admin-validac-0c4f7--filtra-la-lista-de-tiendas-as-admin/error-context.md

  33) [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:30:7 › UC-ADM-04 — ver detalle de tienda pendiente › detalle muestra botones de aprobar y rechazar 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('row').filter({ hasText: 'Empanadas La Porteña' }).getByRole('link', { name: /ver|detalle/i })


      33 |     await stores.goto();
      34 |     await stores.pendingTab.click();
    > 35 |     await stores.viewStoreButton(E2E_STORES.pending.name).click();
         |                                                           ^
      36 |     await expect(stores.approveButton).toBeVisible({ timeout: 8_000 });
      37 |     await expect(stores.rejectButton).toBeVisible();
      38 |   });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:35:59

    Error Context: test-results/use-cases-04-admin-validac-e8ad8-tones-de-aprobar-y-rechazar-as-admin/error-context.md

  34) [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:43:7 › UC-ADM-05 — aprobar tienda › aprobar tienda muestra toast de confirmación 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('row').filter({ hasText: 'Empanadas La Porteña' }).getByRole('link', { name: /ver|detalle/i })


      46 |     await stores.goto();
      47 |     await stores.pendingTab.click();
    > 48 |     await stores.viewStoreButton(E2E_STORES.pending.name).click();
         |                                                           ^
      49 |     await stores.approveButton.click();
      50 |     await expect(stores.successToast).toBeVisible({ timeout: 10_000 });
      51 |     // La tienda ahora debe aparecer en la pestaña aprobadas
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:48:59

    Error Context: test-results/use-cases-04-admin-validac-75fc2-estra-toast-de-confirmación-as-admin/error-context.md

  35) [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:60:7 › UC-ADM-06 — rechazar tienda con motivo › motivo demasiado corto muestra error de validación 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('row').filter({ hasText: 'Empanadas La Porteña' }).getByRole('link', { name: /ver|detalle/i })


      63 |     await stores.goto();
      64 |     await stores.pendingTab.click();
    > 65 |     await stores.viewStoreButton(E2E_STORES.pending.name).click();
         |                                                           ^
      66 |     await stores.rejectButton.click();
      67 |     await stores.rejectionReasonInput.fill("Corto");
      68 |     await stores.confirmRejectionButton.click();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:65:59

    Error Context: test-results/use-cases-04-admin-validac-c9a63-muestra-error-de-validación-as-admin/error-context.md

  36) [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:72:7 › UC-ADM-06 — rechazar tienda con motivo › rechazar con motivo válido muestra toast y mueve a rechazadas 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('row').filter({ hasText: 'Empanadas La Porteña' }).getByRole('link', { name: /ver|detalle/i })


      75 |     await stores.goto();
      76 |     await stores.pendingTab.click();
    > 77 |     await stores.viewStoreButton(E2E_STORES.pending.name).click();
         |                                                           ^
      78 |     await stores.rejectButton.click();
      79 |     await stores.rejectionReasonInput.fill(
      80 |       "Documentación incompleta: falta habilitación municipal",
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:77:59

    Error Context: test-results/use-cases-04-admin-validac-a9978--toast-y-mueve-a-rechazadas-as-admin/error-context.md

  37) [chromium] › e2e/a11y.spec.ts:69:9 › accessibility audit — WCAG AA — public routes › / has no critical or serious violations 

    Error: [serious] color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
      → <a class="group inline-flex it..." href="#tiendas">

    expect(received).toHaveLength(expected)

    Expected length: 0
    Received length: 1
    Received array:  [{"description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds", "help": "Elements must meet minimum color contrast ratio thresholds", "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright", "id": "color-contrast", "impact": "serious", "nodes": [{"all": [], "any": [{"data": {"bgColor": "#d08960", "contrastRatio": 1.96, "expectedContrastRatio": "4.5:1", "fgColor": "#edd2c2", "fontSize": "10.5pt (14px)", "fontWeight": "bold", "messageKey": null}, "id": "color-contrast", "impact": "serious", "message": "Element has insufficient color contrast of 1.96 (foreground color: #edd2c2, background color: #d08960, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1", "relatedNodes": [{"html": "<a class=\"group inline-flex it...\" href=\"#tiendas\">", "target": [".hover\\:scale-\\[1\\.02\\]"]}]}], "failureSummary": "Fix any of the following:
      Element has insufficient color contrast of 1.96 (foreground color: #edd2c2, background color: #d08960, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1", "html": "<a class=\"group inline-flex it...\" href=\"#tiendas\">", "impact": "serious", "none": [], "target": [".hover\\:scale-\\[1\\.02\\]"]}], "tags": ["cat.color", "wcag2aa", "wcag143", "TTv5", "TT13.c", "EN-301-549", "EN-9.1.4.3", "ACT", "RGAAv4", "RGAA-3.2.1"]}]

      62 |   );
      63 |
    > 64 |   expect(criticalViolations, formatViolations(criticalViolations)).toHaveLength(0);
         |                                                                    ^
      65 | }
      66 |
      67 | test.describe("accessibility audit — WCAG AA — public routes", () => {
        at auditRoute (/Users/martinoficialdegui/Desktop/ambulante/e2e/a11y.spec.ts:64:68)
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/a11y.spec.ts:70:7

    Error Context: test-results/a11y-accessibility-audit-—-be141-tical-or-serious-violations-chromium/error-context.md

  38) [chromium] › e2e/auth.spec.ts:157:7 › login page — password flow UI › renders login form ─────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('button', { name: /ingresar/i })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByRole('button', { name: /ingresar/i })


      160 |     await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
      161 |     await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    > 162 |     await expect(page.getByRole("button", { name: /ingresar/i })).toBeVisible();
          |                                                                   ^
      163 |   });
      164 |
      165 |   test("shows validation errors on empty submit", async ({ page }) => {
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/auth.spec.ts:162:67

    Error Context: test-results/auth-login-page-—-password-flow-UI-renders-login-form-chromium/error-context.md

  39) [chromium] › e2e/auth.spec.ts:165:7 › login page — password flow UI › shows validation errors on empty submit 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('button', { name: /ingresar/i })


      165 |   test("shows validation errors on empty submit", async ({ page }) => {
      166 |     await page.goto("/login", { waitUntil: "domcontentloaded" });
    > 167 |     await page.getByRole("button", { name: /ingresar/i }).click();
          |                                                           ^
      168 |     await expect(page.getByText(/email/i).first()).toBeVisible();
      169 |   });
      170 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/auth.spec.ts:167:59

    Error Context: test-results/auth-login-page-—-password-4bcbf-tion-errors-on-empty-submit-chromium/error-context.md

  40) [chromium] › e2e/auth.spec.ts:171:7 › login page — password flow UI › shows error on wrong credentials 

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByRole('button', { name: /ingresar/i })


      173 |     await page.getByLabel(/correo electrónico/i).fill("wrong@test.com");
      174 |     await page.getByLabel(/contraseña/i).fill("wrongpassword1");
    > 175 |     await page.getByRole("button", { name: /ingresar/i }).click();
          |                                                           ^
      176 |     await expect(page.getByText(/credenciales/i)).toBeVisible({ timeout: 5000 });
      177 |   });
      178 | });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/auth.spec.ts:175:59

    Error Context: test-results/auth-login-page-—-password-4e07a--error-on-wrong-credentials-chromium/error-context.md

  41) [chromium] › e2e/dark-mode.spec.ts:28:9 › Dark mode audit › applies .dark class on <html> at / 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      33 |         expect(htmlClasses, `Expected .dark on html at ${route}`).toContain(DARK_CLASS);
      34 |       } finally {
    > 35 |         await darkContext.close();
         |         ^
      36 |       }
      37 |     });
      38 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:35:9

    Error Context: test-results/dark-mode-Dark-mode-audit-applies-dark-class-on-html-at--chromium/error-context.md

  42) [chromium] › e2e/dark-mode.spec.ts:39:9 › Dark mode audit › body background is dark surface at / 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      48 |         );
      49 |       } finally {
    > 50 |         await darkContext.close();
         |         ^
      51 |       }
      52 |     });
      53 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:50:9

    Error Context: test-results/dark-mode-Dark-mode-audit--8441c-kground-is-dark-surface-at--chromium/error-context.md

  43) [chromium] › e2e/dark-mode.spec.ts:54:9 › Dark mode audit › foreground text is not black in dark mode at / 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      64 |         ).not.toBe(BLACK_RGB);
      65 |       } finally {
    > 66 |         await darkContext.close();
         |         ^
      67 |       }
      68 |     });
      69 |   }
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:66:9

    Error Context: test-results/dark-mode-Dark-mode-audit--bd100--not-black-in-dark-mode-at--chromium/error-context.md

  44) [chromium] › e2e/dark-mode.spec.ts:28:9 › Dark mode audit › applies .dark class on <html> at /login 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      33 |         expect(htmlClasses, `Expected .dark on html at ${route}`).toContain(DARK_CLASS);
      34 |       } finally {
    > 35 |         await darkContext.close();
         |         ^
      36 |       }
      37 |     });
      38 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:35:9

    Error Context: test-results/dark-mode-Dark-mode-audit--f5d52-dark-class-on-html-at-login-chromium/error-context.md

  45) [chromium] › e2e/dark-mode.spec.ts:39:9 › Dark mode audit › body background is dark surface at /login 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      48 |         );
      49 |       } finally {
    > 50 |         await darkContext.close();
         |         ^
      51 |       }
      52 |     });
      53 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:50:9

    Error Context: test-results/dark-mode-Dark-mode-audit--7a917-nd-is-dark-surface-at-login-chromium/error-context.md

  46) [chromium] › e2e/dark-mode.spec.ts:54:9 › Dark mode audit › foreground text is not black in dark mode at /login 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      64 |         ).not.toBe(BLACK_RGB);
      65 |       } finally {
    > 66 |         await darkContext.close();
         |         ^
      67 |       }
      68 |     });
      69 |   }
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:66:9

    Error Context: test-results/dark-mode-Dark-mode-audit--0821e-black-in-dark-mode-at-login-chromium/error-context.md

  47) [chromium] › e2e/dark-mode.spec.ts:28:9 › Dark mode audit › applies .dark class on <html> at /register 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      33 |         expect(htmlClasses, `Expected .dark on html at ${route}`).toContain(DARK_CLASS);
      34 |       } finally {
    > 35 |         await darkContext.close();
         |         ^
      36 |       }
      37 |     });
      38 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:35:9

    Error Context: test-results/dark-mode-Dark-mode-audit--a2287-k-class-on-html-at-register-chromium/error-context.md

  48) [chromium] › e2e/dark-mode.spec.ts:39:9 › Dark mode audit › body background is dark surface at /register 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      48 |         );
      49 |       } finally {
    > 50 |         await darkContext.close();
         |         ^
      51 |       }
      52 |     });
      53 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:50:9

    Error Context: test-results/dark-mode-Dark-mode-audit--dc6f9-is-dark-surface-at-register-chromium/error-context.md

  49) [chromium] › e2e/dark-mode.spec.ts:54:9 › Dark mode audit › foreground text is not black in dark mode at /register 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      64 |         ).not.toBe(BLACK_RGB);
      65 |       } finally {
    > 66 |         await darkContext.close();
         |         ^
      67 |       }
      68 |     });
      69 |   }
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:66:9

    Error Context: test-results/dark-mode-Dark-mode-audit--69029-ck-in-dark-mode-at-register-chromium/error-context.md

  50) [chromium] › e2e/dark-mode.spec.ts:71:7 › Dark mode audit › dark surface CSS variable resolves to expected value on landing 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      80 |       );
      81 |     } finally {
    > 82 |       await darkContext.close();
         |       ^
      83 |     }
      84 |   });
      85 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:82:7

    Error Context: test-results/dark-mode-Dark-mode-audit--cab7d-o-expected-value-on-landing-chromium/error-context.md

  51) [chromium] › e2e/dark-mode.spec.ts:86:7 › Dark mode audit › no white-on-white contrast failure on landing in dark mode 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      94 |       expect(mainText.bg).not.toBe(mainText.fg);
      95 |     } finally {
    > 96 |       await darkContext.close();
         |       ^
      97 |     }
      98 |   });
      99 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:96:7

    Error Context: test-results/dark-mode-Dark-mode-audit--78a40-ure-on-landing-in-dark-mode-chromium/error-context.md

  52) [chromium] › e2e/dark-mode.spec.ts:100:7 › Dark mode audit › ThemeToggle button is visible in dark mode on landing 

    Test timeout of 30000ms exceeded.

    Error: browserContext.close: Target page, context or browser has been closed

      107 |       await expect(themeToggle.first()).toBeVisible();
      108 |     } finally {
    > 109 |       await darkContext.close();
          |       ^
      110 |     }
      111 |   });
      112 | });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/dark-mode.spec.ts:109:7

    Error Context: test-results/dark-mode-Dark-mode-audit--1537c-ble-in-dark-mode-on-landing-chromium/error-context.md

  53) [chromium] › e2e/orders-flow.spec.ts:14:7 › orders flow — client golden path › cart → submit → ENVIADO → cancel → CANCELADO → history 

    Error: expect(locator).toBeVisible() failed

    Locator: locator('[data-order-status=\'CANCELADO\']')
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 10000ms
      - waiting for locator('[data-order-status=\'CANCELADO\']')


      49 |
      50 |     await page.goto("/orders", { waitUntil: "domcontentloaded" });
    > 51 |     await expect(page.locator("[data-order-status='CANCELADO']")).toBeVisible({ timeout: 10_000 });
         |                                                                   ^
      52 |   });
      53 | });
      54 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/orders-flow.spec.ts:51:67

    Error Context: test-results/orders-flow-orders-flow-—--2d387-ancel-→-CANCELADO-→-history-chromium/error-context.md

  54) [chromium] › e2e/use-cases/01-auth/auth.uc.spec.ts:15:7 › UC-AUTH-01 — registro de cliente › muestra error por email ya registrado 

    Error: expect(locator).toBeVisible() failed

    Locator: getByText(/email válido/i).or(getByText(/ya.*registrado|en uso/i))
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByText(/email válido/i).or(getByText(/ya.*registrado|en uso/i))


      21 |     await register.submit();
      22 |     // Email ya en uso muestra error de validación o mensaje genérico de email
    > 23 |     await expect(register.emailError.or(page.getByText(/ya.*registrado|en uso/i))).toBeVisible({
         |                                                                                    ^
      24 |       timeout: 8_000,
      25 |     });
      26 |   });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/01-auth/auth.uc.spec.ts:23:84

    Error Context: test-results/use-cases-01-auth-auth.uc--ef2ee-ror-por-email-ya-registrado-chromium/error-context.md

  55) [chromium] › e2e/use-cases/01-auth/auth.uc.spec.ts:106:7 › UC-AUTH-07 — reset de contraseña › ruta /auth/reset-password sin token redirige a error 

    Error: expect(locator).toBeVisible() failed

    Locator: getByText(/token|expirado|inválido/i).or(getByRole('heading', { name: /error/i }))
    Expected: visible
    Timeout: 8000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 8000ms
      - waiting for getByText(/token|expirado|inválido/i).or(getByRole('heading', { name: /error/i }))


      109 |     await expect(
      110 |       page.getByText(/token|expirado|inválido/i).or(page.getByRole("heading", { name: /error/i })),
    > 111 |     ).toBeVisible({ timeout: 8_000 });
          |       ^
      112 |   });
      113 | });
      114 |
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/01-auth/auth.uc.spec.ts:111:7

    Error Context: test-results/use-cases-01-auth-auth.uc--5413c--sin-token-redirige-a-error-chromium/error-context.md

  56) [chromium] › e2e/use-cases/05-flujos-completos/alta-tienda-completa.uc.spec.ts:17:7 › UC-FLOW-06 — alta completa de tienda: onboarding → aprobación admin → dashboard › tienda nueva completa onboarding y admin la aprueba 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('row').filter({ hasText: 'Empanadas La Porteña' })
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 10000ms
      - waiting for getByRole('row').filter({ hasText: 'Empanadas La Porteña' })


      78 |       const nameToApprove = isOnboarding ? uniqueName : "Empanadas La Porteña";
      79 |       const row = adminStores.storeRow(nameToApprove);
    > 80 |       await expect(row).toBeVisible({ timeout: 10_000 });
         |                         ^
      81 |       await adminStores.viewStoreButton(nameToApprove).click();
      82 |       await adminStores.approveButton.click();
      83 |       await expect(adminStores.successToast).toBeVisible({ timeout: 10_000 });
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/05-flujos-completos/alta-tienda-completa.uc.spec.ts:80:25

    Error Context: test-results/use-cases-05-flujos-comple-59017-boarding-y-admin-la-aprueba-chromium/error-context.md

  57) [chromium] › e2e/use-cases/05-flujos-completos/happy-path.uc.spec.ts:24:7 › UC-FLOW-01 — happy path completo (cliente ↔ tienda) › pedido completo ENVIADO → ACEPTADO → EN_CAMINO → FINALIZADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('listitem').first().getByRole('link')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByRole('listitem').first().getByRole('link')


      60 |       const storeDetail = new StoreOrderDetailPage(storePage);
      61 |       await storeOrders.goto();
    > 62 |       await expect(storeOrders.firstOrderCard).toBeVisible({
         |                                                ^
      63 |         timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      64 |       });
      65 |       await storeOrders.clickFirstOrder();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/05-flujos-completos/happy-path.uc.spec.ts:62:48

    Error Context: test-results/use-cases-05-flujos-comple-d1166-DO-→-EN-CAMINO-→-FINALIZADO-chromium/error-context.md

  58) [chromium] › e2e/use-cases/05-flujos-completos/pedido-cancelado.uc.spec.ts:59:7 › UC-FLOW-04 — cliente no puede cancelar pedido ACEPTADO › botón cancelar desaparece tras ACEPTADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('listitem').first().getByRole('link')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByRole('listitem').first().getByRole('link')


      89 |       const storeDetail = new StoreOrderDetailPage(storePage);
      90 |       await storeOrders.goto();
    > 91 |       await expect(storeOrders.firstOrderCard).toBeVisible({
         |                                                ^
      92 |         timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      93 |       });
      94 |       await storeOrders.clickFirstOrder();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/05-flujos-completos/pedido-cancelado.uc.spec.ts:91:48

    Error Context: test-results/use-cases-05-flujos-comple-3100f-ar-desaparece-tras-ACEPTADO-chromium/error-context.md

  59) [chromium] › e2e/use-cases/05-flujos-completos/pedido-expirado.uc.spec.ts:18:7 › UC-FLOW-05 — pedido expirado por inacción de la tienda › cron expire-orders pasa pedido sin respuesta a EXPIRADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByTestId('step-EXPIRADO')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByTestId('step-EXPIRADO')


      47 |
      48 |       // Cliente ve EXPIRADO vía Realtime
    > 49 |       await expect(tracking.statusStep("EXPIRADO")).toBeVisible({
         |                                                     ^
      50 |         timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      51 |       });
      52 |     } finally {
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/05-flujos-completos/pedido-expirado.uc.spec.ts:49:53

    Error Context: test-results/use-cases-05-flujos-comple-abb65-do-sin-respuesta-a-EXPIRADO-chromium/error-context.md

  60) [chromium] › e2e/use-cases/05-flujos-completos/pedido-rechazado.uc.spec.ts:20:7 › UC-FLOW-02 — pedido rechazado por la tienda › tienda rechaza → cliente ve RECHAZADO 

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('listitem').first().getByRole('link')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 15000ms
      - waiting for getByRole('listitem').first().getByRole('link')


      52 |       const storeDetail = new StoreOrderDetailPage(storePage);
      53 |       await storeOrders.goto();
    > 54 |       await expect(storeOrders.firstOrderCard).toBeVisible({
         |                                                ^
      55 |         timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      56 |       });
      57 |       await storeOrders.clickFirstOrder();
        at /Users/martinoficialdegui/Desktop/ambulante/e2e/use-cases/05-flujos-completos/pedido-rechazado.uc.spec.ts:54:48

    Error Context: test-results/use-cases-05-flujos-comple-5d67e-haza-→-cliente-ve-RECHAZADO-chromium/error-context.md

  60 failed
    [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:33:7 › UC-CLI-09 — estado ENVIADO del pedido › página de tracking muestra paso ENVIADO activo 
    [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:76:7 › UC-CLI-13 — confirmar EN_CAMINO por cliente › botón confirmar camino transiciona a EN_CAMINO 
    [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:149:7 › UC-CLI-14 — estado FINALIZADO › pedido finalizado muestra paso FINALIZADO 
    [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:160:7 › UC-CLI-15 — estado RECHAZADO › pedido rechazado por tienda muestra estado RECHAZADO 
    [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:229:7 › UC-CLI-16 — estado EXPIRADO (cron) › después de llamar al cron el pedido pasa a EXPIRADO 
    [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:243:7 › UC-CLI-17 — historial de pedidos › historial muestra pedidos anteriores del cliente 
    [as-client] › e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:251:7 › UC-CLI-17 — historial de pedidos › filtrar por estado CANCELADO filtra la lista 
    [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:12:7 › UC-STO-11 — ver catálogo › catálogo muestra productos existentes de la tienda 
    [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:23:7 › UC-STO-12 — agregar producto › crear producto válido lo muestra en el catálogo 
    [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:62:7 › UC-STO-13 — editar producto › editar producto actualiza los datos en el catálogo 
    [as-store] › e2e/use-cases/03-tienda/catalogo.uc.spec.ts:81:7 › UC-STO-14 — eliminar producto › eliminar producto lo quita del catálogo 
    [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:12:7 › UC-STO-07 — toggle de disponibilidad › toggle cambia el estado de disponibilidad 
    [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:40:7 › UC-STO-09 — acceso al catálogo desde dashboard › link al catálogo navega a /store/catalog 
    [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:67:7 › UC-STO-22 — ver perfil de la tienda › perfil muestra el nombre de la tienda 
    [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:78:7 › UC-STO-23 — editar perfil de la tienda › guardar cambios en el perfil muestra feedback de éxito 
    [as-store] › e2e/use-cases/03-tienda/dashboard.uc.spec.ts:91:7 › UC-STO-24 — analytics de la tienda › página de analytics muestra KPIs 
    [as-store] › e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:50:7 › UC-STO-18 — aceptar pedido entrante › aceptar primer pedido lo mueve a ACEPTADO 
    [as-store] › e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:86:7 › UC-STO-19 — rechazar pedido › rechazar pedido lo mueve a RECHAZADO 
    [as-store] › e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts:122:7 › UC-STO-20 — finalizar pedido › finalizar pedido lo mueve a FINALIZADO 
    [as-admin] › e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:7:7 › UC-ADM-01 — dashboard de KPIs › dashboard muestra los 4 KPIs principales 
    [as-admin] › e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:27:7 › UC-ADM-15 — audit log de pedidos › página de pedidos admin es accesible 
    [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:7:7 › UC-ADM-12 — cola de moderación › página de moderación carga correctamente 
    [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:19:7 › UC-ADM-13 — desestimar reporte › desestimar reporte muestra toast de confirmación 
    [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:35:7 › UC-ADM-14 — eliminar contenido reportado › eliminar contenido muestra toast de confirmación 
    [as-admin] › e2e/use-cases/04-admin/moderacion.uc.spec.ts:48:7 › UC-ADM-14 — eliminar contenido reportado › cola vacía tras procesar todos los reportes 
    [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:20:7 › UC-ADM-08 — buscar usuario › buscar por nombre del cliente filtra resultados 
    [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:31:7 › UC-ADM-09 — filtrar por rol › filtro de rol actualiza la lista 
    [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:43:7 › UC-ADM-10 — suspender usuario › suspender usuario muestra badge de suspendido 
    [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:57:7 › UC-ADM-11 — reactivar usuario › reactivar usuario suspendido muestra badge activo 
    [as-admin] › e2e/use-cases/04-admin/usuarios.uc.spec.ts:75:7 › UC-ADM-11b — historial de pedidos de usuario › detalle del usuario muestra tabla de pedidos 
    [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:8:7 › UC-ADM-02 — ver tiendas pendientes de validación › pestaña pendientes muestra tiendas en espera 
    [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:19:7 › UC-ADM-03 — buscar tienda por nombre › buscar por nombre filtra la lista de tiendas 
    [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:30:7 › UC-ADM-04 — ver detalle de tienda pendiente › detalle muestra botones de aprobar y rechazar 
    [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:43:7 › UC-ADM-05 — aprobar tienda › aprobar tienda muestra toast de confirmación 
    [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:60:7 › UC-ADM-06 — rechazar tienda con motivo › motivo demasiado corto muestra error de validación 
    [as-admin] › e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts:72:7 › UC-ADM-06 — rechazar tienda con motivo › rechazar con motivo válido muestra toast y mueve a rechazadas 
    [chromium] › e2e/a11y.spec.ts:69:9 › accessibility audit — WCAG AA — public routes › / has no critical or serious violations 
    [chromium] › e2e/auth.spec.ts:157:7 › login page — password flow UI › renders login form ───────
    [chromium] › e2e/auth.spec.ts:165:7 › login page — password flow UI › shows validation errors on empty submit 
    [chromium] › e2e/auth.spec.ts:171:7 › login page — password flow UI › shows error on wrong credentials 
    [chromium] › e2e/dark-mode.spec.ts:28:9 › Dark mode audit › applies .dark class on <html> at / ─
    [chromium] › e2e/dark-mode.spec.ts:39:9 › Dark mode audit › body background is dark surface at / 
    [chromium] › e2e/dark-mode.spec.ts:54:9 › Dark mode audit › foreground text is not black in dark mode at / 
    [chromium] › e2e/dark-mode.spec.ts:28:9 › Dark mode audit › applies .dark class on <html> at /login 
    [chromium] › e2e/dark-mode.spec.ts:39:9 › Dark mode audit › body background is dark surface at /login 
    [chromium] › e2e/dark-mode.spec.ts:54:9 › Dark mode audit › foreground text is not black in dark mode at /login 
    [chromium] › e2e/dark-mode.spec.ts:28:9 › Dark mode audit › applies .dark class on <html> at /register 
    [chromium] › e2e/dark-mode.spec.ts:39:9 › Dark mode audit › body background is dark surface at /register 
    [chromium] › e2e/dark-mode.spec.ts:54:9 › Dark mode audit › foreground text is not black in dark mode at /register 
    [chromium] › e2e/dark-mode.spec.ts:71:7 › Dark mode audit › dark surface CSS variable resolves to expected value on landing 
    [chromium] › e2e/dark-mode.spec.ts:86:7 › Dark mode audit › no white-on-white contrast failure on landing in dark mode 
    [chromium] › e2e/dark-mode.spec.ts:100:7 › Dark mode audit › ThemeToggle button is visible in dark mode on landing 
    [chromium] › e2e/orders-flow.spec.ts:14:7 › orders flow — client golden path › cart → submit → ENVIADO → cancel → CANCELADO → history 
    [chromium] › e2e/use-cases/01-auth/auth.uc.spec.ts:15:7 › UC-AUTH-01 — registro de cliente › muestra error por email ya registrado 
    [chromium] › e2e/use-cases/01-auth/auth.uc.spec.ts:106:7 › UC-AUTH-07 — reset de contraseña › ruta /auth/reset-password sin token redirige a error 
    [chromium] › e2e/use-cases/05-flujos-completos/alta-tienda-completa.uc.spec.ts:17:7 › UC-FLOW-06 — alta completa de tienda: onboarding → aprobación admin → dashboard › tienda nueva completa onboarding y admin la aprueba 
    [chromium] › e2e/use-cases/05-flujos-completos/happy-path.uc.spec.ts:24:7 › UC-FLOW-01 — happy path completo (cliente ↔ tienda) › pedido completo ENVIADO → ACEPTADO → EN_CAMINO → FINALIZADO 
    [chromium] › e2e/use-cases/05-flujos-completos/pedido-cancelado.uc.spec.ts:59:7 › UC-FLOW-04 — cliente no puede cancelar pedido ACEPTADO › botón cancelar desaparece tras ACEPTADO 
    [chromium] › e2e/use-cases/05-flujos-completos/pedido-expirado.uc.spec.ts:18:7 › UC-FLOW-05 — pedido expirado por inacción de la tienda › cron expire-orders pasa pedido sin respuesta a EXPIRADO 
    [chromium] › e2e/use-cases/05-flujos-completos/pedido-rechazado.uc.spec.ts:20:7 › UC-FLOW-02 — pedido rechazado por la tienda › tienda rechaza → cliente ve RECHAZADO 
  7 skipped
  88 passed (11.4m)
 ELIFECYCLE  Command failed with exit code 1.
