import os
import time
from faker import Faker
import psycopg2
from datetime import datetime, timedelta
import random
from decimal import Decimal
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Faker
fake = Faker()

# Database connection parameters from environment variables
DB_PARAMS = {
    "dbname": os.getenv("POSTGRES_DB", "investments"),
    "user": os.getenv("POSTGRES_USER", "deniz"),
    "password": os.getenv("POSTGRES_PASSWORD", "1227"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432")
}

# Define possible values for categorical fields
PROVIDERS = ['VIAC', 'Revolut', 'Neon', 'UBS', 'Credit Suisse', 'PostFinance', 'Swissquote']
INVESTMENT_TYPES = ['cash', 'bond', 'stock', 'real_estate', 'commodity', 'crypto']
CURRENCIES = ['CHF', 'USD', 'EUR']

# Investment names by type
INVESTMENT_NAMES = {
    'cash': ['Savings', 'Current Account', 'Emergency Fund', 'Fixed Deposit'],
    'bond': ['Government Bond', 'Corporate Bond', 'Municipal Bond', 'Treasury Bond'],
    'stock': ['Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'Meta', 'Nvidia', 'Netflix'],
    'real_estate': ['Swiss Property Fund', 'Global REIT', 'Commercial RE Fund', 'Residential RE Fund'],
    'commodity': ['Gold', 'Silver', 'Platinum', 'Palladium', 'Copper', 'Oil'],
    'crypto': ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polkadot', 'Avalanche']
}


def wait_for_db(max_retries=30, delay_seconds=2):
    """Wait for the database to become available"""
    retries = 0
    while retries < max_retries:
        try:
            conn = psycopg2.connect(**DB_PARAMS)
            conn.close()
            print("Database is available!")
            return True
        except psycopg2.OperationalError:
            retries += 1
            print(f"Waiting for database... Attempt {retries}/{max_retries}")
            time.sleep(delay_seconds)
    return False


def connect_to_db():
    """Establish database connection with retry logic"""
    if not wait_for_db():
        raise Exception("Could not connect to database after maximum retries")

    try:
        conn = psycopg2.connect(**DB_PARAMS)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise


def create_custom_types(conn):
    """Create custom types if they don't exist"""
    try:
        with conn.cursor() as cur:
            # Check if types exist before creating them
            cur.execute("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investment_type') THEN
                        CREATE TYPE investment_type AS ENUM (
                            'cash', 'bond', 'stock', 'real_estate', 'commodity', 'crypto'
                        );
                    END IF;

                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type') THEN
                        CREATE TYPE currency_type AS ENUM ('CHF', 'USD', 'EUR');
                    END IF;
                END $$;
            """)
        conn.commit()
    except Exception as e:
        print(f"Error creating custom types: {e}")
        conn.rollback()
        raise


def create_investment_tables(conn):
    """Create both investments and investments_fake tables"""
    try:
        with conn.cursor() as cur:
            # Create investments table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS investments (
                    investment_id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    provider VARCHAR(50) NOT NULL,
                    investment_type investment_type NOT NULL,
                    investment_name VARCHAR(100) NOT NULL,
                    amount NUMERIC(12,2) NOT NULL,
                    currency currency_type NOT NULL,
                    unit NUMERIC(12,4),
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                -- Drop and recreate investments_fake table
                DROP TABLE IF EXISTS investments_fake;

                CREATE TABLE investments_fake (
                    investment_id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    provider VARCHAR(50) NOT NULL,
                    investment_type investment_type NOT NULL,
                    investment_name VARCHAR(100) NOT NULL,
                    amount NUMERIC(12,2) NOT NULL,
                    currency currency_type NOT NULL,
                    unit NUMERIC(12,4),
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()
    except Exception as e:
        print(f"Error creating tables: {e}")
        conn.rollback()
        raise


def generate_fake_investment(date):
    """Generate a single fake investment record"""
    investment_type = random.choice(INVESTMENT_TYPES)

    # Generate amount based on investment type
    amount_ranges = {
        'cash': (100, 50000),
        'bond': (1000, 20000),
        'stock': (100, 10000),
        'real_estate': (5000, 100000),
        'commodity': (100, 5000),
        'crypto': (50, 5000)
    }

    min_amount, max_amount = amount_ranges[investment_type]
    amount = random.uniform(min_amount, max_amount)

    # Generate units for certain investment types
    unit = None
    if investment_type in ['stock', 'crypto']:
        unit = round(random.uniform(0.1, 100), 4)

    return {
        'name': fake.first_name(),
        'provider': random.choice(PROVIDERS),
        'investment_type': investment_type,
        'investment_name': random.choice(INVESTMENT_NAMES[investment_type]),
        'amount': round(Decimal(str(amount)), 2),
        'currency': random.choice(CURRENCIES),
        'unit': unit,
        'notes': fake.text(max_nb_chars=50) if random.random() > 0.5 else None,
        'created_at': date,
        'updated_at': date
    }


def generate_fake_data(num_investments=50):
    """Generate 6 months of fake historical data"""
    fake_data = []
    end_date = datetime.now()

    for month in range(6):
        date = end_date - timedelta(days=30 * month)
        month_investments = num_investments + random.randint(-5, 5)

        for _ in range(month_investments):
            fake_data.append(generate_fake_investment(date))

    return fake_data


def insert_fake_data(conn, fake_data):
    """Insert fake data into investments_fake table"""
    try:
        with conn.cursor() as cur:
            for investment in fake_data:
                cur.execute("""
                    INSERT INTO investments_fake (
                        name, provider, investment_type, investment_name,
                        amount, currency, unit, notes, created_at, updated_at
                    ) VALUES (
                        %(name)s, %(provider)s, %(investment_type)s, %(investment_name)s,
                        %(amount)s, %(currency)s, %(unit)s, %(notes)s, %(created_at)s, %(updated_at)s
                    )
                """, investment)
        conn.commit()
    except Exception as e:
        print(f"Error inserting data: {e}")
        conn.rollback()
        raise


def main():
    print("Starting fake data ingestion process...")

    try:
        # Connect to database
        conn = connect_to_db()

        # Create custom types
        create_custom_types(conn)

        # Create both investment tables
        create_investment_tables(conn)

        # Generate and insert fake data
        fake_data = generate_fake_data()
        insert_fake_data(conn, fake_data)

        print(f"Successfully generated and inserted {len(fake_data)} fake investment records")

    except Exception as e:
        print(f"Error in main process: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()


if __name__ == "__main__":
    main()