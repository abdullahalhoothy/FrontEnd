export interface SignUpProps {
  onSubmit?: (formData: FormData) => void;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  country: string;
  reason?: string[];
  userType?: string;
  teamId?: string;
}

export interface FormErrors {
  [key: string]: string;
}
