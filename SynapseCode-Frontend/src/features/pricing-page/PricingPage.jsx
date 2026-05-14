import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { pricingPlans } from "../main-page/data/mainPageData";
import { cn, layout, ui } from "../main-page/mainPageClasses";
import { tiltHandlers } from "../main-page/utils/tiltHandlers";
import { Icon } from "../main-page/components/ui/Icon";
import { Logo } from "../main-page/components/ui/Logo";
import { selectPlan } from "../../shared/api";
import { useAuthStore } from "../auth/store/authStore";
import { showError, showSuccess } from "../../shared/utils/toast";
import "../../styles/main-page.css";

export function PricingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loadProfile = useAuthStore((state) => state.loadProfile);
  const setUserPlanType = useAuthStore((state) => state.setUserPlanType);
  const setUserRole = useAuthStore((state) => state.setUserRole);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [orgData, setOrgData] = useState({
    institutionName: "",
    numStudents: "",
  });

  const fullName = useMemo(() => {
    return [user?.name, user?.surname].filter(Boolean).join(" ").trim();
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    const update = (event) => {
      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);
    };

    window.addEventListener("pointermove", update, { passive: true });
    return () => window.removeEventListener("pointermove", update);
  }, []);

  useEffect(() => {
    setPaymentData((current) => ({
      ...current,
      name: current.name || fullName || user?.username || "",
      email: current.email || user?.email || "",
    }));
  }, [fullName, user?.email, user?.username]);

  useEffect(() => {
    if (!selectedPlan) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPlan(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPlan]);

  const getProfileForPlan = async () => {
    if (user?.email && (fullName || user?.username)) {
      return {
        email: user.email,
        name: fullName || user.username,
      };
    }

    const profileResult = await loadProfile();
    if (!profileResult.success) {
      throw new Error(profileResult.error);
    }

    const profile = profileResult.data;
    const profileName =
      [profile?.name, profile?.surname].filter(Boolean).join(" ").trim() ||
      profile?.username;

    if (!profile?.email || !profileName) {
      throw new Error("No se pudo completar tu nombre y correo para seleccionar el plan.");
    }

    return {
      email: profile.email,
      name: profileName,
    };
  };

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  };

  const formatExpiry = (value) => {
    // Solo permitir números
    let digits = value.replace(/\D/g, '').slice(0, 4);
    
    // Procesar mes si hay 2 o más dígitos
    if (digits.length >= 2) {
      let month = digits.slice(0, 2);
      
      // Validar que el mes esté entre 01-12
      const monthNum = parseInt(month, 10);
      if (monthNum > 12) {
        month = '12'; // Si es mayor a 12, establecer a 12
      } else if (monthNum === 0 && digits.length === 2) {
        month = '0'; // Dejar que escriba 0 temporalmente para luego ser 01-09
      }
      
      // Si tenemos año también
      if (digits.length >= 3) {
        const year = digits.slice(2, 4);
        digits = month + '/' + year;
      } else {
        digits = month;
      }
    }
    
    return digits;
  };

  const isCardExpired = (expiryString) => {
    if (!expiryString || expiryString.length !== 5) return false;
    
    const [month, year] = expiryString.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Validar mes válido
    if (monthNum < 1 || monthNum > 12) return true;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Últimos 2 dígitos
    const currentMonth = currentDate.getMonth() + 1; // getMonth retorna 0-11
    
    // Si el año es menor al actual, está vencida
    if (yearNum < currentYear) return true;
    
    // Si es el año actual, verificar que el mes no sea anterior
    if (yearNum === currentYear && monthNum < currentMonth) return true;
    
    return false;
  };

  const getOrgAmount = () => {
    const students = Number(orgData.numStudents);
    if (!students || students < 1) return null;
    return students * 2;
  };

  const activatePlan = async (planName, customerData) => {
    setIsSubmitting(true);
    try {
      const profile = customerData || (await getProfileForPlan());
      const payload = {
        planName,
        email: profile.email,
        name: profile.name,
        ...(customerData?.institutionName && { institutionName: customerData.institutionName }),
        ...(customerData?.maxParticipants && { maxParticipants: customerData.maxParticipants }),
        amountPaid:
          planName === 'ORG'
            ? getOrgAmount()
            : planName === 'PRO'
            ? 20
            : undefined,
      };
      const { data } = await selectPlan(payload);

      if (!data?.success) {
        throw new Error(data?.message || "No se pudo seleccionar el plan.");
      }

      setUserPlanType(planName);
      if (planName === "ORG") {
        setUserRole("ORG_ROLE");
      }
      setSelectedPlan(null);
      showSuccess(
        planName === "FREE"
          ? "Plan FREE activado"
          : planName === "PRO"
          ? "Pago verificado. Plan PRO activado"
          : "Pago verificado. Plan ORG activado"
      );
      window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 0);
    } catch (err) {
      showError(err.response?.data?.message || err.message || "Error al procesar el plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanClick = async (plan) => {
    const planName = plan.name.toUpperCase();

    if (planName === "FREE") {
      await activatePlan("FREE");
      return;
    }

    if (planName === "PRO") {
      setSelectedPlan(plan);
    }

    if (planName === "ORG" && user?.role === "USER_ROLE") {
      setSelectedPlan(plan);
    }
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;
    const formattedValue =
      name === 'cardNumber'
        ? formatCardNumber(value)
        : name === 'expiry'
        ? formatExpiry(value)
        : value;

    setPaymentData((current) => ({ ...current, [name]: formattedValue }));
  };

  const handleOrgChange = (event) => {
    const { name, value } = event.target;
    setOrgData((current) => ({ ...current, [name]: value }));
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    const planName = selectedPlan.name.toUpperCase();

    if (planName === "PRO") {
      if (!paymentData.name.trim() || !paymentData.email.trim()) {
        showError("Completa nombre y correo para continuar.");
        return;
      }

      if (
        paymentData.cardNumber.replace(/\D/g, "").length < 12 ||
        !paymentData.expiry.trim() ||
        paymentData.cvc.trim().length < 3
      ) {
        showError("Completa los datos de pago.");
        return;
      }

      if (isCardExpired(paymentData.expiry)) {
        showError("La tarjeta ha vencido. Por favor, usa una tarjeta válida.");
        return;
      }

      await activatePlan("PRO", {
        name: paymentData.name.trim(),
        email: paymentData.email.trim(),
      });
    }

    if (planName === "ORG") {
      if (!orgData.institutionName.trim() || !orgData.numStudents || orgData.numStudents < 1) {
        showError("Completa el nombre de la institución y el número de estudiantes.");
        return;
      }

      if (!paymentData.name.trim() || !paymentData.email.trim()) {
        showError("Completa nombre y correo para continuar.");
        return;
      }

      if (
        paymentData.cardNumber.replace(/\D/g, "").length < 12 ||
        !paymentData.expiry.trim() ||
        paymentData.cvc.trim().length < 3
      ) {
        showError("Completa los datos de pago.");
        return;
      }

      if (isCardExpired(paymentData.expiry)) {
        showError("La tarjeta ha vencido. Por favor, usa una tarjeta válida.");
        return;
      }

      await activatePlan("ORG", {
        name: paymentData.name.trim(),
        email: paymentData.email.trim(),
        institutionName: orgData.institutionName.trim(),
        maxParticipants: parseInt(orgData.numStudents),
      });
    }
  };

  return (
    <div className={cn(layout.page, ui.page, "grid min-h-screen content-center py-8")}>
      <header className="mx-auto mb-8 flex w-[min(calc(100%_-_2rem),78rem)] items-center justify-between gap-4 max-[620px]:grid max-[620px]:justify-items-center">
        <Link to="/" className="inline-flex items-center">
          <Logo />
        </Link>
        <Link to="/" className={cn(layout.button, ui.buttonBase, ui.buttonGhost)}>
          Ir al inicio
          <Icon name="arrow" size={16} />
        </Link>
      </header>

      <main className={layout.shell}>
        <section className="grid justify-items-center text-center">
          <p className={cn(layout.headingEyebrow, ui.eyebrow)}>PLANES</p>
          <h1 className={cn(layout.headingTitle, ui.heading, "max-w-4xl")}>
            Empieza gratis, escala cuando quieras
          </h1>
          <p className={cn(layout.headingText, ui.mutedText)}>
            Sin compromisos. El plan gratuito no tiene fecha de vencimiento.
          </p>
        </section>

        <section className={cn(layout.pricing, "mt-14")} aria-label="Planes de SynapseCode">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                layout.priceCard,
                ui.panel,
                "mp-tilt-card mp-pricing-card min-h-[30rem]",
                plan.popular
                  ? "is-popular border-accent/50 bg-[linear-gradient(145deg,rgba(255,0,255,0.1),rgba(15,23,42,0.76))]"
                  : ""
              )}
              {...tiltHandlers}
            >
              <div className={layout.planHead}>
                <h2 className={cn(layout.planTitle, "text-white")}>{plan.name}</h2>
                {plan.popular && (
                  <span className={cn(layout.planBadge, "font-extrabold", ui.pinkChip)}>
                    Popular
                  </span>
                )}
              </div>

              <p className={layout.price}>
                <strong className={cn(layout.priceValue, "text-white")}>{plan.price}</strong>
                <span className={ui.softText}>/{plan.description}</span>
              </p>
              <p className={cn("leading-[1.75]", ui.mutedText)}>
                Acceso abierto para estudiantes, docentes y equipos.
              </p>

              <ul className={layout.featureList}>
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
                    className={cn(
                      layout.featureItem,
                      feature.included ? "text-slate-200" : `is-muted ${ui.softText}`,
                      feature.included ? "[&>svg]:text-emerald-400" : "[&>svg]:text-muted-foreground"
                    )}
                  >
                    <Icon name={feature.included ? "check" : "x"} size={16} />
                    {feature.text}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isSubmitting || (plan.name.toUpperCase() === "ORG" && user?.role !== "USER_ROLE")}
                onClick={() => handlePlanClick(plan)}
                className={cn(
                  layout.button,
                  ui.buttonBase,
                  "mt-auto",
                  plan.popular ? ui.buttonPrimary : ui.buttonGhost,
                  (plan.name.toUpperCase() === "ORG" && user?.role !== "USER_ROLE") ? "cursor-not-allowed opacity-60" : ""
                )}
              >
                {isSubmitting && plan.name.toUpperCase() !== "ORG" ? "Procesando..." : plan.buttonText}
              </button>
            </article>
          ))}
        </section>
      </main>

      {selectedPlan &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] grid place-items-center overflow-y-auto bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedPlan(null);
              }
            }}
          >
          <form
            onSubmit={handlePaymentSubmit}
            className={cn(ui.panel, "grid w-[min(100%,30rem)] gap-4 rounded-[1.1rem] p-6")}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${selectedPlan.name.toLowerCase()}-payment-title`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={cn(layout.headingEyebrow, ui.eyebrow)}>PAGO {selectedPlan.name.toUpperCase()}</p>
                <h2 id={`${selectedPlan.name.toLowerCase()}-payment-title`} className="mt-2 text-2xl font-extrabold text-white">
                  Completa tus datos
                </h2>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-border-light bg-slate-950/60 text-muted hover:text-white"
                onClick={() => setSelectedPlan(null)}
                aria-label="Cerrar modal"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {selectedPlan.name.toUpperCase() === "ORG" && (
              <>
                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Nombre de la institución
                  <input
                    name="institutionName"
                    value={orgData.institutionName}
                    onChange={handleOrgChange}
                    className={cn(layout.input, ui.input)}
                    placeholder="Universidad Nacional"
                  />
                </label>

                <label className="grid gap-2 text-sm font-bold text-slate-200">
                  Número de estudiantes
                  <input
                    name="numStudents"
                    type="number"
                    min="1"
                    value={orgData.numStudents}
                    onChange={handleOrgChange}
                    className={cn(layout.input, ui.input)}
                    placeholder="100"
                  />
                </label>

                {getOrgAmount() !== null && (
                  <p className="text-sm text-slate-200">
                    Monto a pagar: <strong>${getOrgAmount()}</strong>
                  </p>
                )}
              </>
            )}

            <label className="grid gap-2 text-sm font-bold text-slate-200">
              Nombre
              <input
                name="name"
                value={paymentData.name}
                onChange={handlePaymentChange}
                className={cn(layout.input, ui.input)}
                placeholder="Nombre completo"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-200">
              Correo
              <input
                name="email"
                type="email"
                value={paymentData.email}
                onChange={handlePaymentChange}
                className={cn(layout.input, ui.input)}
                placeholder="tu@email.com"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-200">
              Numero de tarjeta
              <input
                name="cardNumber"
                inputMode="numeric"
                value={paymentData.cardNumber}
                onChange={handlePaymentChange}
                className={cn(layout.input, ui.input)}
                placeholder="4242 4242 4242 4242"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-bold text-slate-200">
                Vencimiento
                <input
                  name="expiry"
                  inputMode="numeric"
                  value={paymentData.expiry}
                  onChange={handlePaymentChange}
                  className={cn(layout.input, ui.input)}
                  placeholder="MM/AA"
                  maxLength="5"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-200">
                CVC
                <input
                  name="cvc"
                  inputMode="numeric"
                  maxLength="3"
                  value={paymentData.cvc}
                  onChange={handlePaymentChange}
                  className={cn(layout.input, ui.input)}
                  placeholder="123"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(layout.button, ui.buttonBase, ui.buttonPrimary, "mt-2 w-full")}
            >
              {isSubmitting ? "Verificando pago..." : `Pagar y activar ${selectedPlan.name.toUpperCase()}`}
            </button>
          </form>
          </div>,
          document.body
        )}
    </div>
  );
}

export default PricingPage;
