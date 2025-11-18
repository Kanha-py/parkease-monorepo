"use client";

import { useEffect, useState } from "react";
import { getPricingRules, createPricingRule, deletePricingRule, PricingRule } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export function PricingRulesManager({ lotId }: { lotId: string }) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("Event Rate");
  const [rate, setRate] = useState("100");
  const [priority, setPriority] = useState("5");

  const fetchRules = async () => {
    try {
      const data = await getPricingRules(lotId);
      setRules(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [lotId]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createPricingRule(lotId, {
        name,
        rate: parseFloat(rate),
        priority: parseInt(priority)
      });
      toast.success("Rule Created");
      setIsOpen(false);
      fetchRules(); // Refresh list
    } catch (e) {
      toast.error("Failed to create rule");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePricingRule(id);
      toast.success("Rule Deleted");
      fetchRules();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Flex Rates Engine</h3>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">+ Add Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Pricing Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Rule Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IPL Match" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hourly Rate (₹)</Label>
                  <Input type="number" value={rate} onChange={e => setRate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Priority (0-10)</Label>
                  <Input type="number" value={priority} onChange={e => setPriority(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Higher overrides lower.</p>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? "Saving..." : "Create Rule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>₹{rule.rate}/hr</TableCell>
                <TableCell>
                  <Badge variant={rule.priority > 0 ? "default" : "secondary"}>
                    {rule.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(rule.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
