import { Expose } from 'class-transformer';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Base } from '../../entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Wish } from '../../wishes/entities/wish.entity';

@Entity()
export class Offer extends Base {
  @ManyToOne(() => User, (user) => user.offers)
  user: User;

  @ManyToOne(() => Wish, (wish) => wish.offers)
  item: Wish;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: false })
  hidden: boolean;

  @Expose()
  get name(): string {
    return this.user?.username;
  }
}
