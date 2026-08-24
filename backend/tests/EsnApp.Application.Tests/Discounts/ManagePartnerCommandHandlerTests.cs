using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.ReorderPartners;
using EsnApp.Application.Discounts.UpdatePartnerStatus;
using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Tests.Discounts;

public class ManagePartnerCommandHandlerTests
{
    [Fact]
    public async Task UpdateStatus_ActivatingPartner_AppendsItToPublicOrder()
    {
        var first = CreatePartner(PartnerStatus.Active, 0);
        var draft = CreatePartner(PartnerStatus.Draft, 0);
        var repository = new FakePartnerRepository(first, draft);
        var handler = new UpdatePartnerStatusCommandHandler(repository);

        var result = await handler.Handle(
            new UpdatePartnerStatusCommand(draft.Id, PartnerStatus.Active),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(PartnerStatus.Active, draft.Status);
        Assert.Equal(1, draft.DisplayOrder);
    }

    [Fact]
    public async Task Reorder_AllActivePartners_UpdatesEveryDisplayOrder()
    {
        var first = CreatePartner(PartnerStatus.Active, 0);
        var second = CreatePartner(PartnerStatus.Active, 1);
        var repository = new FakePartnerRepository(first, second);
        var handler = new ReorderPartnersCommandHandler(repository);

        var result = await handler.Handle(
            new ReorderPartnersCommand([second.Id, first.Id]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, second.DisplayOrder);
        Assert.Equal(1, first.DisplayOrder);
        Assert.Equal([second.Id, first.Id], result.Value!.Select(partner => partner.Id));
    }

    [Fact]
    public async Task Reorder_MissingActivePartner_ReturnsFailure()
    {
        var first = CreatePartner(PartnerStatus.Active, 0);
        var second = CreatePartner(PartnerStatus.Active, 1);
        var handler = new ReorderPartnersCommandHandler(
            new FakePartnerRepository(first, second));

        var result = await handler.Handle(
            new ReorderPartnersCommand([first.Id]),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    private static Partner CreatePartner(PartnerStatus status, int displayOrder) => new()
    {
        Id = Guid.NewGuid(),
        Name = $"Partner {Guid.NewGuid()}",
        LogoPath = "/logo.svg",
        ShortDescription = "Short description",
        Description = "Description",
        Status = status,
        DisplayOrder = displayOrder,
    };

    private sealed class FakePartnerRepository(params Partner[] partners) : IPartnerRepository
    {
        private readonly List<Partner> _partners = [.. partners];

        public Task<IReadOnlyList<Partner>> GetAllAsync(
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Partner>>(
                _partners.Where(partner => partner.Status == PartnerStatus.Active).ToList());

        public Task<Partner?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(_partners.FirstOrDefault(
                partner => partner.Id == id && partner.Status == PartnerStatus.Active));

        public Task<IReadOnlyList<Partner>> GetAdminListAsync(
            PartnerStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Partner>>(
                _partners
                    .Where(partner => !status.HasValue || partner.Status == status.Value)
                    .OrderBy(partner => partner.DisplayOrder)
                    .ToList());

        public Task<Partner?> GetAdminByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(_partners.FirstOrDefault(partner => partner.Id == id));

        public Task<Partner?> GetAdminBySlugAsync(
            string slug,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<Partner?>(null);

        public Task<Partner> AddAsync(
            Partner entity,
            CancellationToken cancellationToken = default)
        {
            _partners.Add(entity);
            return Task.FromResult(entity);
        }

        public Task<Partner> UpdateAsync(
            Partner entity,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(entity);

        public Task UpdateRangeAsync(
            IReadOnlyCollection<Partner> entities,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<bool> DeleteAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            var partner = _partners.FirstOrDefault(p => p.Id == id);
            if (partner is null)
                return Task.FromResult(false);

            _partners.Remove(partner);
            return Task.FromResult(true);
        }
    }
}
