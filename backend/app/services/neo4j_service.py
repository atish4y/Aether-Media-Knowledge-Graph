from neo4j import AsyncGraphDatabase, AsyncDriver
from app.config import get_settings


class Neo4jService:
    _driver: AsyncDriver | None = None

    @classmethod
    async def connect(cls):
        settings = get_settings()
        cls._driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
        # Verify connectivity
        await cls._driver.verify_connectivity()
        print(f"Connected to Neo4j at {settings.neo4j_uri}")
        
        # Initialize Vector Index for Semantic Search (384 dims for all-MiniLM-L6-v2)
        try:
            await cls.execute_write('''
                CREATE VECTOR INDEX movie_embeddings IF NOT EXISTS
                FOR (m:Movie)
                ON (m.embedding)
                OPTIONS {indexConfig: {
                `vector.dimensions`: 384,
                `vector.similarity_function`: 'cosine'
                }}
            ''')
            print("Vector Index verified.")
        except Exception as e:
            print("Error verifying Vector Index:", e)

    @classmethod
    async def close(cls):
        if cls._driver:
            await cls._driver.close()
            print("✓ Neo4j connection closed")

    @classmethod
    def get_driver(cls) -> AsyncDriver:
        if cls._driver is None:
            raise RuntimeError("Neo4j driver not initialized. Call connect() first.")
        return cls._driver

    @classmethod
    async def execute_read(cls, query: str, parameters: dict = None):
        async with cls._driver.session() as session:
            result = await session.run(query, parameters or {})
            return [record.data() async for record in result]

    @classmethod
    async def execute_write(cls, query: str, parameters: dict = None):
        async with cls._driver.session() as session:
            result = await session.run(query, parameters or {})
            return [record.data() async for record in result]
