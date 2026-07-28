"use client";

import AdminGuard from "@/components/AdminGuard";
import {
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  HelpCircle,
  Clock,
  ExternalLink,
  Ticket,
} from "lucide-react";
import { useState } from "react";

export default function AdminSupport() {
  const [openTicketModal, setOpenTicketModal] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "Medium",
    description: "",
  });

  const handleCreateTicket = async () => {
    console.log(ticketForm);

    // API call here

    setOpenTicketModal(false);

    setTicketForm({
      subject: "",
      category: "",
      priority: "Medium",
      description: "",
    });
  };

  return (
    <AdminGuard>
      <section className="space-y-6">

        {/* Header */}
        <div className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Headphones size={28} />
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-600">
                Customer Support
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Support Center
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Need help? Contact our support team for technical assistance,
                billing issues, feature requests, or account-related questions.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <Mail className="mb-3 text-emerald-600" size={26} />

            <h3 className="text-lg font-semibold text-slate-900">
              Email Support
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Send us your queries anytime.
            </p>

            <a
              href="mailto:support@smartcafe.com"
              className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline"
            >
              smartcafesaas@gmail.com
            </a>
          </div>

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <MessageCircle className="mb-3 text-green-600" size={26} />

            <h3 className="text-lg font-semibold text-slate-900">
              WhatsApp Support
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Chat directly with our support team.
            </p>

            <a
              href="https://wa.me/919999999999"
              target="_blank"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline"
            >
              Open WhatsApp
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <Phone className="mb-3 text-blue-600" size={26} />

            <h3 className="text-lg font-semibold text-slate-900">
              Phone Support
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Available during business hours.
            </p>

            <p className="mt-4 text-sm font-medium text-slate-900">
              +91 7708027444
            </p>
          </div>
        </div>

        {/* Support Information */}
        <div className="grid gap-5 lg:grid-cols-2">

          <div className="rounded border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Ticket className="text-emerald-600" size={22} />

              <h3 className="text-lg font-semibold text-slate-900">
                Raise a Support Ticket
              </h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              For technical issues, billing concerns, feature requests,
              integration support, or account-related problems.
            </p>

            <button
              onClick={() => setOpenTicketModal(true)}
              className="mt-5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Create Ticket
            </button>
          </div>

          <div className="rounded border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="text-amber-500" size={22} />

              <h3 className="text-lg font-semibold text-slate-900">
                Support Hours
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                Monday - Friday:
                <span className="ml-2 font-medium text-slate-900">
                  9:00 AM - 6:00 PM
                </span>
              </p>

              <p>
                Saturday:
                <span className="ml-2 font-medium text-slate-900">
                  10:00 AM - 4:00 PM
                </span>
              </p>

              <p>
                Sunday:
                <span className="ml-2 font-medium text-red-600">
                  Closed
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-indigo-600" size={24} />

            <h3 className="text-lg font-semibold text-slate-900">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="font-medium text-slate-900">
                How do I renew my subscription?
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Navigate to the Subscription page and select your preferred plan.
              </p>
            </div>

            <div>
              <p className="font-medium text-slate-900">
                What happens when my subscription expires?
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Your account enters a grace period before service restrictions apply.
              </p>
            </div>

            <div>
              <p className="font-medium text-slate-900">
                Can I upgrade my plan anytime?
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Yes. Upgrades take effect immediately after payment.
              </p>
            </div>
          </div>
        </div>

        {openTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  Create Support Ticket
                </h3>

                <button
                  onClick={() => setOpenTicketModal(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 p-5">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        subject: e.target.value,
                      })
                    }
                    placeholder="Enter issue title"
                    className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <select
                    value={ticketForm.category}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        category: e.target.value,
                      })
                    }
                    className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  >
                    <option value="">Select Category</option>
                    <option value="Billing">Billing Issue</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Technical">Technical Support</option>
                    <option value="Bug">Bug Report</option>
                    <option value="Feature">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    value={ticketForm.priority}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        priority: e.target.value,
                      })
                    }
                    className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🟠 High</option>
                    <option value="Critical">🔴 Critical</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows={5}
                    value={ticketForm.description}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe your issue in detail..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
                <button
                  onClick={() => setOpenTicketModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateTicket}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        )}

      </section>
    </AdminGuard>
  );
}