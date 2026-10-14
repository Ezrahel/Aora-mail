"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function ForwardingPage() {
  const cache = useQueryClient(); const [domainId, setDomainId] = useState(""); const [source, setSource] = useState(""); const [destination, setDestination] = useState("");
  const domains = useQuery({ queryKey: ["domains"], queryFn: async () => (await api.listDomains()).data });
  const forwarders = useQuery({ queryKey: ["forwarders"], queryFn: async () => (await api.listForwarders()).data });
  const create = useMutation({ mutationFn: () => api.createForwarder({ domainId, source, destination }), onSuccess: async () => { setSource(""); setDestination(""); toast.success("Forwarding address created."); await cache.invalidateQueries({ queryKey: ["forwarders"] }); }, onError: () => toast.error("Could not create forwarding address.") });
  const remove = useMutation({ mutationFn: api.deleteForwarder, onSuccess: async () => { await cache.invalidateQueries({ queryKey: ["forwarders"] }); } });
  const domainOptions = [{ value: "", label: "Choose domain" }, ...(domains.data?.filter((domain) => domain.status === "active").map((domain) => ({ value: domain.id, label: domain.name })) ?? [])];
  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-semibold text-ink">Aliases & forwarding</h1><p className="mt-1 text-sm text-muted">Route an alternate business address to any inbox without creating another mailbox.</p></div><section className="space-y-3 rounded-md border border-border bg-white p-5"><Select aria-label="Domain" value={domainId} onChange={(event) => setDomainId(event.target.value)} options={domainOptions} /><Input value={source} onChange={(event) => setSource(event.target.value)} placeholder="sales" aria-label="Alias local part" /><Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="person@example.com" type="email" aria-label="Destination email" /><Button disabled={!domainId || !source || !destination} loading={create.isPending} onClick={() => create.mutate()}>Create forwarding address</Button></section><section className="overflow-hidden rounded-md border border-border bg-white">{forwarders.data?.length ? <ul className="divide-y divide-border">{forwarders.data.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 p-4 text-sm"><span><strong>{item.source}</strong> → {item.destination}</span><Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate(item.id)}>Remove</Button></li>)}</ul> : <p className="p-5 text-sm text-muted">No aliases or forwarding addresses yet.</p>}</section></div>;
}
