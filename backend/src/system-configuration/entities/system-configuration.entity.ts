import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('system_configuration')
export class SystemConfigurationEntity {
  @PrimaryColumn({ default: 'main' })
  id: string;

  @Column({ name: 'openai_prompt_base', type: 'text', nullable: true })
  openAiPromptBase: string;

  @Column({ name: 'welcome_credit_enabled', type: 'boolean', default: true })
  welcomeCreditEnabled: boolean;

  @Column({ name: 'welcome_credit_amount', type: 'int', default: 1 })
  welcomeCreditAmount: number;
}
