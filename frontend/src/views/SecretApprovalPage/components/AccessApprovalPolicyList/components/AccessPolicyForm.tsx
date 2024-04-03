import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createNotification } from "@app/components/notifications";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  FormControl,
  Input,
  Modal,
  ModalContent,
  Select,
  SelectItem
} from "@app/components/v2";
import { useWorkspace } from "@app/context";
import {
  useCreateAccessApprovalPolicy,
  useUpdateAccessApprovalPolicy
} from "@app/hooks/api/accessApproval";
import { TAccessApprovalPolicy } from "@app/hooks/api/accessApproval/types";
import { TWorkspaceUser } from "@app/hooks/api/users/types";

type Props = {
  isOpen?: boolean;
  onToggle: (isOpen: boolean) => void;
  members?: TWorkspaceUser[];
  workspaceId: string;
  editValues?: TAccessApprovalPolicy;
};

const formSchema = z
  .object({
    environment: z.string(),
    name: z.string().optional(),
    secretPath: z.string().optional().nullable(),
    approvals: z.number().min(1),
    approvers: z.string().array().min(1)
  })
  .refine((data) => data.approvals <= data.approvers.length, {
    path: ["approvals"],
    message: "The number of approvals should be lower than the number of approvers."
  });

type TFormSchema = z.infer<typeof formSchema>;

export const AccessPolicyForm = ({
  isOpen,
  onToggle,
  members = [],
  workspaceId,
  editValues
}: Props) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
    values: editValues ? { ...editValues, environment: editValues.environment.slug } : undefined
  });
  const { currentWorkspace } = useWorkspace();

  const environments = currentWorkspace?.environments || [];
  useEffect(() => {
    if (!isOpen) reset({});
  }, [isOpen]);

  const isEditMode = Boolean(editValues);

  const { mutateAsync: createAccessApprovalPolicy } = useCreateAccessApprovalPolicy();
  const { mutateAsync: updateAccessApprovalPolicy } = useUpdateAccessApprovalPolicy();

  const handleCreatePolicy = async (data: TFormSchema) => {
    try {
      await createAccessApprovalPolicy({
        ...data,
        workspaceId
      });
      createNotification({
        type: "success",
        text: "Successfully created policy"
      });
      onToggle(false);
    } catch (err) {
      console.log(err);
      createNotification({
        type: "error",
        text: "Failed to create policy"
      });
    }
  };

  const handleUpdatePolicy = async (data: TFormSchema) => {
    if (!editValues?.id) return;
    try {
      await updateAccessApprovalPolicy({
        id: editValues?.id,
        ...data,
        workspaceId
      });
      createNotification({
        type: "success",
        text: "Successfully updated policy"
      });
      onToggle(false);
    } catch (err) {
      console.log(err);
      createNotification({
        type: "error",
        text: "failed  to update policy"
      });
    }
  };

  const handleFormSubmit = async (data: TFormSchema) => {
    if (isEditMode) {
      await handleUpdatePolicy(data);
    } else {
      await handleCreatePolicy(data);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onToggle}>
      <ModalContent title={isEditMode ? "Edit access policy" : "Create access policy"}>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState: { error } }) => (
              <FormControl label="Policy Name" isError={Boolean(error)} errorText={error?.message}>
                <Input {...field} value={field.value || ""} />
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="environment"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <FormControl
                label="Environment"
                isRequired
                className="mt-4"
                isError={Boolean(error)}
                errorText={error?.message}
              >
                <Select
                  value={value}
                  onValueChange={(val) => onChange(val)}
                  className="w-full border border-mineshaft-500"
                >
                  {environments.map((sourceEnvironment) => (
                    <SelectItem
                      value={sourceEnvironment.slug}
                      key={`azure-key-vault-environment-${sourceEnvironment.slug}`}
                    >
                      {sourceEnvironment.name}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="approvers"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <FormControl
                label="Approvers Required"
                isError={Boolean(error)}
                errorText={error?.message}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Input
                      isReadOnly
                      value={value?.length ? `${value.length} selected` : "None"}
                      className="text-left"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                    align="start"
                  >
                    <DropdownMenuLabel>
                      Select members that are allowed to approve changes
                    </DropdownMenuLabel>
                    {members.map(({ id, user }) => {
                      const isChecked = value?.includes(id);
                      return (
                        <DropdownMenuItem
                          onClick={(evt) => {
                            evt.preventDefault();
                            onChange(
                              isChecked ? value?.filter((el) => el !== id) : [...(value || []), id]
                            );
                          }}
                          key={`create-policy-members-${id}`}
                          iconPos="right"
                          icon={isChecked && <FontAwesomeIcon icon={faCheckCircle} />}
                        >
                          {user.email}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="approvals"
            defaultValue={1}
            render={({ field, fieldState: { error } }) => (
              <FormControl
                label="Approvals Required"
                isError={Boolean(error)}
                errorText={error?.message}
              >
                <Input
                  {...field}
                  type="number"
                  onChange={(el) => field.onChange(parseInt(el.target.value, 10))}
                />
              </FormControl>
            )}
          />
          <div className="mt-8 flex items-center space-x-4">
            <Button type="submit" isLoading={isSubmitting} isDisabled={isSubmitting}>
              Save
            </Button>
            <Button onClick={() => onToggle(false)} variant="outline_bg">
              Close
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
};